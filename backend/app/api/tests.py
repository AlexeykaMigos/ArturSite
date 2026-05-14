from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from datetime import datetime
import uuid

from ..core.database import get_db
from ..core.security import get_current_user
from ..core.email import email_service
from ..models.user import User
from ..models.content import Topic, Test, TestAttempt, TopicProgress, Lab, LabSubmission
from ..schemas.test import (
    TestCreate, TestUpdate, TestResponse, TestForUser,
    TestSubmission, TestResultResponse, TestAttemptHistory, TestResultDetail
)

router = APIRouter(prefix="/topics", tags=["tests"])


@router.get("/{topic_id}/test", response_model=TestForUser)
async def get_test(topic_id: str, db: Session = Depends(get_db)):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Test).where(Test.topic_id == topic_uuid))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    topic_result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = topic_result.scalar_one_or_none()

    questions = test.questions if isinstance(test.questions, list) else []

    if test.shuffle_questions:
        import random
        random.shuffle(questions)

    processed_questions = []
    for q in questions:
        q_data = {
            "id": q.get("id"),
            "type": q.get("type"),
            "text": q.get("text")
        }

        if q.get("options"):
            options = [{"id": o.get("id"), "text": o.get("text")} for o in q.get("options", [])]
            if test.shuffle_options:
                import random
                random.shuffle(options)
            q_data["options"] = options

        if q.get("type") == "matching":
            q_data["matching_terms"] = q.get("matching_terms", [])
            q_data["matching_definitions"] = q.get("matching_definitions", [])

        processed_questions.append(q_data)

    return {
        "id": test.id,
        "topic_id": test.topic_id,
        "questions": processed_questions,
        "passing_score": test.passing_score,
        "time_limit": topic.time_limit if topic else None
    }


@router.post("/{topic_id}/test/submit", response_model=TestResultResponse)
async def submit_test(
    topic_id: str,
    submission: TestSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Test).where(Test.topic_id == topic_uuid))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    questions = test.questions if isinstance(test.questions, list) else []
    passing_score = test.passing_score

    total_correct = 0
    total_points = 0
    details = []

    answers_dict = {a.get("question_id"): a for a in submission.answers}

    for q in questions:
        q_id = q.get("id")
        q_type = q.get("type")
        correct = False
        points_earned = 0
        max_points = 1

        user_answer = None
        correct_answer = None

        if q_type == "single":
            correct_opt = next((o for o in q.get("options", []) if o.get("is_correct")), None)
            correct_answer = correct_opt.get("id") if correct_opt else None

            user_ans = answers_dict.get(q_id, {}).get("selected_option_id")
            user_answer = user_ans

            if user_ans == correct_answer:
                correct = True
                points_earned = 1

        elif q_type == "multiple":
            correct_opts = [o.get("id") for o in q.get("options", []) if o.get("is_correct")]
            correct_answer = correct_opts

            user_ans = answers_dict.get(q_id, {}).get("selected_option_ids", [])
            user_answer = user_ans

            if set(user_ans) == set(correct_opts):
                correct = True
                points_earned = 1
            else:
                partial = len(set(user_ans) & set(correct_opts)) / len(correct_opts)
                points_earned = partial

        elif q_type == "matching":
            correct_pairs = q.get("matching_pairs") or q.get("pairs") or []
            correct_set = {
                (pair.get("term_id"), pair.get("definition_id"))
                for pair in correct_pairs
                if pair.get("term_id") and pair.get("definition_id")
            }
            user_pairs = answers_dict.get(q_id, {}).get("pairs", [])
            user_set = {
                (pair.get("term_id"), pair.get("definition_id"))
                for pair in user_pairs
                if pair.get("term_id") and pair.get("definition_id")
            }

            max_points = len(correct_set)
            points_earned = len(correct_set & user_set) if max_points > 0 else 0
            correct = max_points > 0 and points_earned == max_points
            user_answer = user_pairs
            correct_answer = correct_pairs

        elif q_type == "text":
            correct_keywords = [k.lower() for k in q.get("correct_keywords", [])]
            user_ans = answers_dict.get(q_id, {}).get("answer_text", "").lower().strip()
            user_answer = user_ans

            correct_answer = correct_keywords

            if any(kw in user_ans for kw in correct_keywords):
                correct = True
                points_earned = 1

        total_correct += points_earned
        total_points += max_points

        details.append({
            "question_id": q_id,
            "type": q_type,
            "correct": correct,
            "user_answer": user_answer,
            "correct_answer": correct_answer
        })

    percentage = int((total_correct / total_points * 100) if total_points > 0 else 0)
    passed = percentage >= passing_score

    attempt = TestAttempt(
        user_id=current_user.id,
        topic_id=topic_uuid,
        test_id=test.id,
        score=percentage,
        passed=passed,
        answers=submission.answers,
        time_spent=submission.time_spent
    )
    db.add(attempt)

    topic_result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = topic_result.scalar_one_or_none()

    lab_required = bool(topic and topic.has_lab)
    lab_approved = False
    if lab_required:
        lab_submission_result = db.execute(
            select(LabSubmission)
            .join(Lab, LabSubmission.lab_id == Lab.id)
            .where(
                Lab.topic_id == topic_uuid,
                LabSubmission.user_id == current_user.id,
                LabSubmission.status == "approved"
            )
            .limit(1)
        )
        lab_approved = lab_submission_result.scalar_one_or_none() is not None

    should_complete = passed and (not lab_required or lab_approved)

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_uuid
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress:
        if progress.best_test_score is None or percentage > progress.best_test_score:
            progress.best_test_score = percentage

        if passed and should_complete:
            progress.status = "completed"
            progress.completed_at = datetime.utcnow()
        elif passed and progress.status != "completed":
            progress.status = "in_progress"
        elif progress.status == "not_started":
            progress.status = "in_progress"
    else:
        progress = TopicProgress(
            user_id=current_user.id,
            topic_id=topic_uuid,
            status="completed" if should_complete else "in_progress",
            best_test_score=percentage,
            completed_at=datetime.utcnow() if should_complete else None
        )
        db.add(progress)

    db.commit()
    db.refresh(attempt)

    # Send email notification if test passed
    if passed and topic:
        email_service.send_test_passed_notification(
            to_email=current_user.email,
            student_name=current_user.name,
            topic_title=topic.title,
            score=percentage
        )

    return {
        "attempt_id": attempt.id,
        "total_score": int(total_correct),
        "percentage": percentage,
        "passed": passed,
        "passed_score": passing_score,
        "time_spent": submission.time_spent,
        "details": details,
        "topic_id": topic_id,
        "created_at": attempt.created_at
    }


@router.get("/history", response_model=List[TestAttemptHistory])
async def get_test_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(
        select(TestAttempt)
        .where(TestAttempt.user_id == current_user.id)
        .order_by(TestAttempt.created_at.desc())
        .limit(50)
    )
    attempts = result.scalars().all()

    return [
        {
            "id": a.id,
            "topic_id": a.topic_id,
            "score": a.score,
            "percentage": a.score,
            "passed": a.passed,
            "time_spent": a.time_spent,
            "created_at": a.created_at
        }
        for a in attempts
    ]


@router.get("/{topic_id}/test/history")
async def get_topic_test_history(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(
        select(TestAttempt)
        .where(
            TestAttempt.user_id == current_user.id,
            TestAttempt.topic_id == topic_uuid
        )
        .order_by(TestAttempt.created_at.desc())
    )
    attempts = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "score": a.score,
            "passed": a.passed,
            "time_spent": a.time_spent,
            "created_at": a.created_at.isoformat()
        }
        for a in attempts
    ]


@router.get("/{topic_id}/test/best")
async def get_best_attempt(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(
        select(TestAttempt)
        .where(
            TestAttempt.user_id == current_user.id,
            TestAttempt.topic_id == topic_uuid
        )
        .order_by(TestAttempt.score.desc())
        .limit(1)
    )
    best = result.scalar_one_or_none()

    if not best:
        return None

    return {
        "score": best.score,
        "passed": best.passed,
        "created_at": best.created_at.isoformat()
    }
