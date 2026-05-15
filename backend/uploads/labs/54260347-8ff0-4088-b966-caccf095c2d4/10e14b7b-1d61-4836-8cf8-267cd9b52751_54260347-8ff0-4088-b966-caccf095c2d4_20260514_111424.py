from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
import uuid
import os
import aiofiles
import mimetypes

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.email import email_service
from ..models.user import User
from ..models.content import Topic, Lab, LabSubmission, TopicProgress, TestAttempt
from ..schemas.lab import (
    LabCreate, LabUpdate, LabResponse, LabSubmissionResponse,
    LabSubmissionGrade, StudentLabSubmission, TeacherLabView, LabSubmissionList,
)

router = APIRouter(tags=["labs"])

# ✅ ИСПРАВЛЕНИЕ 5: константы для валидации файлов
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # docx
    "application/msword",  # doc
    "image/png",
    "image/jpeg",
}
ALLOWED_EXTENSIONS = {"pdf", "zip", "rar", "docx", "doc", "png", "jpg", "jpeg"}

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")


def _now():
    return datetime.now(timezone.utc)


async def _validate_and_read_file(file: UploadFile) -> bytes:
    """Читает файл с валидацией размера и MIME-типа."""
    content = await file.read()

    # ✅ Проверка размера
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024} MB",
        )

    # ✅ Проверка расширения
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"File type '.{ext}' is not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ✅ Проверка MIME-типа (не доверяем только расширению)
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"MIME type '{file.content_type}' is not allowed",
        )

    return content


@router.get("/topics/{topic_id}/lab", response_model=LabResponse)
async def get_lab(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    result = db.execute(select(Lab).where(Lab.topic_id == topic_uuid))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    return lab


@router.post("/topics/{topic_id}/lab/submit", response_model=LabSubmissionResponse)
async def submit_lab(
    topic_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    lab = db.execute(select(Lab).where(Lab.topic_id == topic_uuid)).scalar_one_or_none()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found for this topic")

    # ✅ ИСПРАВЛЕНИЕ 5: валидация файла
    content = await _validate_and_read_file(file)

    # Безопасное имя файла по шаблону из спецификации
    ext = (file.filename or "file").rsplit(".", 1)[-1].lower()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{current_user.id}_{lab.id}_{timestamp}.{ext}"

    # Сохраняем в защищённую папку
    user_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    submission = LabSubmission(
        lab_id=lab.id,
        user_id=current_user.id,
        file_path=file_path,
        file_name=file.filename or safe_filename,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission


@router.post("/labs", response_model=LabResponse)
async def create_lab(
    lab_data: LabCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    try:
        topic_uuid = uuid.UUID(lab_data.topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    topic = db.execute(select(Topic).where(Topic.id == topic_uuid)).scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing = db.execute(select(Lab).where(Lab.topic_id == topic_uuid)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Lab already exists for this topic")

    lab = Lab(
        topic_id=topic_uuid,
        title=lab_data.title,
        description=lab_data.description,
        requirements=lab_data.requirements,
        max_score=lab_data.max_score,
        allowed_extensions=lab_data.allowed_extensions,
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)

    topic.has_lab = True
    db.commit()

    return lab


@router.put("/labs/{lab_id}/grade")
async def grade_lab(
    lab_id: str,
    grade_data: LabSubmissionGrade,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    try:
        lab_uuid = uuid.UUID(lab_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid lab submission ID")

    submission = db.execute(
        select(LabSubmission).where(LabSubmission.id == lab_uuid)
    ).scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    lab = db.execute(select(Lab).where(Lab.id == submission.lab_id)).scalar_one_or_none()
    if lab and grade_data.grade > lab.max_score:
        raise HTTPException(
            status_code=400,
            detail=f"Grade cannot exceed max score ({lab.max_score})",
        )

    submission.grade = grade_data.grade
    submission.feedback = grade_data.feedback
    submission.status = "graded"
    submission.graded_at = _now()
    submission.graded_by = current_user.id
    db.commit()
    db.refresh(submission)

    # Уведомление студенту
    student = db.execute(select(User).where(User.id == submission.user_id)).scalar_one_or_none()
    if student:
        try:
            await email_service.send_lab_graded_notification(
                student.email,
                grade_data.grade,
                grade_data.feedback,
            )
        except Exception:
            pass  # не прерываем — уведомление некритично

    return submission
