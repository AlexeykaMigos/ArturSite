from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid
import os
import aiofiles

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.email import email_service
from ..models.user import User
from ..models.content import Topic, Lab, LabSubmission, TopicProgress, TestAttempt
from ..schemas.lab import (
    LabCreate, LabUpdate, LabResponse, LabSubmissionResponse,
    LabSubmissionGrade, StudentLabSubmission, TeacherLabView, LabSubmissionList
)

router = APIRouter(tags=["labs"])


@router.get("/topics/{topic_id}/lab", response_model=LabResponse)
async def get_lab(topic_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Lab).where(Lab.topic_id == topic_id))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    return lab


@router.post("/labs", response_model=LabResponse)
async def create_lab(
    lab_data: LabCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    topic_result = db.execute(select(Topic).where(Topic.id == lab_data.topic_id))
    topic = topic_result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing = db.execute(select(Lab).where(Lab.topic_id == lab_data.topic_id)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Lab already exists for this topic")

    lab = Lab(
        topic_id=lab_data.topic_id,
        title=lab_data.title,
        description=lab_data.description,
        requirements=lab_data.requirements,
        max_score=lab_data.max_score,
        allowed_extensions=lab_data.allowed_extensions
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)

    topic.has_lab = True
    db.commit()

    return lab


@router.put("/topics/{topic_id}/lab", response_model=LabResponse)
async def update_lab(
    topic_id: str,
    lab_data: LabUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Lab).where(Lab.topic_id == topic_id))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    update_data = lab_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lab, field, value)

    db.commit()
    db.refresh(lab)

    return lab


@router.post("/topics/{topic_id}/lab/submit", response_model=LabSubmissionResponse)
async def submit_lab(
    topic_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Lab).where(Lab.topic_id == topic_id))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in lab.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File extension .{ext} not allowed. Allowed: {lab.allowed_extensions}"
        )

    upload_dir = f"uploads/labs/{lab.id}"
    os.makedirs(upload_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    new_filename = f"{current_user.id}_{lab.id}_{timestamp}.{ext}"
    file_path = os.path.join(upload_dir, new_filename)

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    submission = LabSubmission(
        lab_id=lab.id,
        user_id=current_user.id,
        file_path=file_path,
        file_name=file.filename,
        status="pending"
    )
    db.add(submission)

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_id
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress:
        if progress.status == "not_started":
            progress.status = "in_progress"
    else:
        progress = TopicProgress(
            user_id=current_user.id,
            topic_id=topic_id,
            status="in_progress"
        )
        db.add(progress)

    db.commit()
    db.refresh(submission)

    return submission


@router.get("/labs/my", response_model=List[StudentLabSubmission])
async def get_my_labs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(
        select(LabSubmission, Lab, Topic)
        .join(Lab, LabSubmission.lab_id == Lab.id)
        .join(Topic, Lab.topic_id == Topic.id)
        .where(LabSubmission.user_id == current_user.id)
        .order_by(LabSubmission.submitted_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": sub.id,
            "lab_id": sub.lab_id,
            "user_id": sub.user_id,
            "file_name": sub.file_name,
            "status": sub.status,
            "grade": sub.grade,
            "feedback": sub.feedback,
            "submitted_at": sub.submitted_at,
            "graded_at": sub.graded_at,
            "topic_title": topic.title
        }
        for sub, lab, topic in rows
    ]


@router.get("/labs/{submission_id}", response_model=LabSubmissionResponse)
async def get_lab_submission(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(select(LabSubmission).where(LabSubmission.id == submission_id))
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.user_id != current_user.id and current_user.role.value not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return submission


@router.put("/labs/{submission_id}/grade", response_model=LabSubmissionResponse)
async def grade_lab(
    submission_id: str,
    grade_data: LabSubmissionGrade,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(LabSubmission).where(LabSubmission.id == submission_id))
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    result = db.execute(select(Lab).where(Lab.id == submission.lab_id))
    lab = result.scalar_one_or_none()

    if grade_data.grade < 0 or (lab and grade_data.grade > lab.max_score):
        raise HTTPException(status_code=400, detail="Invalid grade")

    submission.grade = grade_data.grade
    submission.feedback = grade_data.feedback
    submission.status = "approved" if grade_data.grade >= (lab.max_score * 0.6) else "needs_revision"
    submission.graded_at = datetime.utcnow()
    submission.graded_by = current_user.id

    topic = None
    if lab:
        topic_result = db.execute(select(Topic).where(Topic.id == lab.topic_id))
        topic = topic_result.scalar_one_or_none()

    if submission.status == "approved" and topic:
        test_passed = True
        if topic.has_test:
            test_passed = False
            progress_result = db.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == submission.user_id,
                    TopicProgress.topic_id == topic.id
                )
            )
            progress = progress_result.scalar_one_or_none()
            if progress and progress.best_test_score is not None:
                test_passed = progress.best_test_score >= topic.passing_score
            else:
                attempt_result = db.execute(
                    select(TestAttempt)
                    .where(
                        TestAttempt.user_id == submission.user_id,
                        TestAttempt.topic_id == topic.id
                    )
                    .order_by(TestAttempt.score.desc())
                    .limit(1)
                )
                attempt = attempt_result.scalar_one_or_none()
                test_passed = bool(attempt and attempt.score >= topic.passing_score)

        progress_result = db.execute(
            select(TopicProgress).where(
                TopicProgress.user_id == submission.user_id,
                TopicProgress.topic_id == topic.id
            )
        )
        progress = progress_result.scalar_one_or_none()

        if progress:
            if test_passed or not topic.has_test:
                progress.status = "completed"
                progress.completed_at = datetime.utcnow()
            elif progress.status == "not_started":
                progress.status = "in_progress"
        else:
            progress = TopicProgress(
                user_id=submission.user_id,
                topic_id=topic.id,
                status="completed" if (test_passed or not topic.has_test) else "in_progress",
                completed_at=datetime.utcnow() if (test_passed or not topic.has_test) else None
            )
            db.add(progress)

    db.commit()
    db.refresh(submission)

    # Send email notification
    user_result = db.execute(select(User).where(User.id == submission.user_id))
    student = user_result.scalar_one_or_none()
    if student:
        email_service.send_lab_graded_notification(
            to_email=student.email,
            student_name=student.name,
            lab_title=lab.title if lab else "Лабораторная работа",
            grade=grade_data.grade,
            feedback=grade_data.feedback or ""
        )

    return submission


@router.get("/teacher/labs", response_model=LabSubmissionList)
async def get_pending_labs(
    page: int = 1,
    page_size: int = 20,
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin"))
):
    query = select(LabSubmission, Lab, Topic, User).join(Lab, LabSubmission.lab_id == Lab.id).join(Topic, Lab.topic_id == Topic.id).join(User, LabSubmission.user_id == User.id)

    if status != "all":
        query = query.where(LabSubmission.status == status)

    count_query = select(func.count()).select_from(LabSubmission)
    if status != "all":
        count_query = count_query.where(LabSubmission.status == status)

    count_result = db.execute(count_query)
    total = count_result.scalar()

    query = query.order_by(LabSubmission.submitted_at.desc()).offset((page - 1) * page_size).limit(page_size)

    result = db.execute(query)
    rows = result.all()

    submissions = [
        {
            "id": sub.id,
            "lab_id": sub.lab_id,
            "user_id": sub.user_id,
            "file_name": sub.file_name,
            "status": sub.status,
            "grade": sub.grade,
            "feedback": sub.feedback,
            "submitted_at": sub.submitted_at,
            "graded_at": sub.graded_at,
            "student_name": student.name,
            "student_email": student.email,
            "topic_title": topic.title,
            "lab_title": lab.title
        }
        for sub, lab, topic, student in rows
    ]

    return {
        "submissions": submissions,
        "total": total,
        "page": page,
        "page_size": page_size
    }
