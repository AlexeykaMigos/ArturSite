from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER
import io

from ..core.database import get_db
from ..core.security import get_current_user
from ..core.email import email_service
from ..models.user import User
from ..models.content import Topic, Module, TopicProgress, TestAttempt, LabSubmission
from ..schemas.progress import (
    TopicProgressResponse, OverallProgress, TopicStats,
    StudentStats, CommentBase, CommentCreate, CommentResponse
)

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=OverallProgress)
async def get_overall_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    modules_result = db.execute(select(Module).where(Module.is_published == True).order_by(Module.order))
    modules = modules_result.scalars().all()

    total_topics = 0
    completed = 0
    in_progress = 0

    modules_data = []
    for module in modules:
        topics_result = db.execute(select(Topic).where(Topic.module_id == module.id))
        topics = topics_result.scalars().all()

        module_completed = 0
        module_in_progress = 0
        topics_data = []

        for topic in topics:
            total_topics += 1
            progress_result = db.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == current_user.id,
                    TopicProgress.topic_id == topic.id
                )
            )
            progress = progress_result.scalar_one_or_none()

            status = progress.status if progress else "not_started"

            if status == "completed":
                completed += 1
                module_completed += 1
            elif status == "in_progress":
                in_progress += 1
                module_in_progress += 1

            topics_data.append({
                "id": str(topic.id),
                "status": status,
                "best_score": progress.best_test_score if progress else None
            })

        modules_data.append({
            "id": str(module.id),
            "title": module.title,
            "total_topics": len(topics),
            "completed_topics": module_completed,
            "in_progress_topics": module_in_progress,
            "topics": topics_data
        })

    percentage = int((completed / total_topics * 100) if total_topics > 0 else 0)

    return {
        "total_topics": total_topics,
        "completed_topics": completed,
        "in_progress_topics": in_progress,
        "percentage": percentage,
        "modules": modules_data
    }


@router.get("/stats", response_model=List[TopicStats])
async def get_topic_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts_result = db.execute(
        select(TestAttempt)
        .where(TestAttempt.user_id == current_user.id)
        .order_by(TestAttempt.created_at.desc())
    )
    attempts = attempts_result.scalars().all()

    topic_ids = list(set(a.topic_id for a in attempts))
    stats = []

    for topic_id in topic_ids:
        topic_result = db.execute(select(Topic).where(Topic.id == topic_id))
        topic = topic_result.scalar_one_or_none()

        if not topic:
            continue

        module_result = db.execute(select(Module).where(Module.id == topic.module_id))
        module = module_result.scalar_one_or_none()

        topic_attempts = [a for a in attempts if a.topic_id == topic_id]
        best_score = max(a.score for a in topic_attempts) if topic_attempts else None

        stats.append({
            "topic_id": topic_id,
            "topic_title": topic.title,
            "module_title": module.title if module else "",
            "best_score": best_score,
            "attempts": len(topic_attempts),
            "last_attempt": topic_attempts[0].created_at if topic_attempts else None
        })

    return stats


@router.get("/student-stats", response_model=StudentStats)
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_topics_result = db.execute(select(func.count(Topic.id)))
    total_topics = total_topics_result.scalar()

    completed_result = db.execute(
        select(func.count(TopicProgress.id))
        .where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.status == "completed"
        )
    )
    completed = completed_result.scalar()

    attempts_result = db.execute(
        select(TestAttempt).where(TestAttempt.user_id == current_user.id)
    )
    attempts = attempts_result.scalars().all()

    avg_score = sum(a.score for a in attempts) / len(attempts) if attempts else 0

    labs_result = db.execute(
        select(LabSubmission).where(
            LabSubmission.user_id == current_user.id,
            LabSubmission.status == "approved"
        )
    )
    labs_approved = len(labs_result.scalars().all())

    labs_pending_result = db.execute(
        select(LabSubmission).where(
            LabSubmission.user_id == current_user.id,
            LabSubmission.status == "pending"
        )
    )
    labs_pending = len(labs_pending_result.scalars().all())

    return {
        "total_topics": total_topics or 0,
        "completed_topics": completed or 0,
        "average_score": round(avg_score, 1),
        "total_tests_taken": len(attempts),
        "labs_completed": labs_approved,
        "labs_pending": labs_pending
    }


@router.get("/topic/{topic_id}", response_model=TopicProgressResponse)
async def get_topic_progress(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_id
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        return {
            "topic_id": topic_id,
            "status": "not_started",
            "best_test_score": None,
            "completed_at": None
        }

    return {
        "topic_id": progress.topic_id,
        "status": progress.status,
        "best_test_score": progress.best_test_score,
        "completed_at": progress.completed_at
    }


@router.get("/certificate")
async def generate_certificate(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_topics_result = db.execute(select(func.count(Topic.id)))
    total_topics = total_topics_result.scalar()

    completed_result = db.execute(
        select(func.count(TopicProgress.id))
        .where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.status == "completed"
        )
    )
    completed = completed_result.scalar()

    if not total_topics or completed < total_topics:
        raise HTTPException(status_code=400, detail="Not all topics completed yet")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=36,
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=30
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=18,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceAfter=20
    )

    story.append(Paragraph("СЕРТИФИКАТ", title_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("Настоящим подтверждается, что", normal_style))
    story.append(Paragraph(f"<b>{current_user.name}</b>", ParagraphStyle('Bold', parent=normal_style, fontSize=24)))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("успешно завершил(а) изучение курса", normal_style))
    story.append(Paragraph("<b>Информационные системы и технологии</b>", ParagraphStyle('Bold', parent=normal_style, fontSize=22)))
    story.append(Spacer(1, 1*cm))

    percentage = int((completed / total_topics * 100))
    story.append(Paragraph(f"Пройдено тем: {completed} из {total_topics} ({percentage}%)", normal_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f"Дата выдачи: {datetime.utcnow().strftime('%d.%m.%Y')}", ParagraphStyle('Date', parent=styles['Normal'], fontSize=14, alignment=TA_CENTER)))

    doc.build(story)
    buffer.seek(0)

    # Send email notification for course completion
    email_service.send_course_completed_notification(
        to_email=current_user.email,
        student_name=current_user.name,
        completion_percentage=percentage
    )

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate_{current_user.name}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"}
    )
