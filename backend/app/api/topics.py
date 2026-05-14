from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
import os
import aiofiles
from datetime import datetime

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.cache import invalidate_cache
from ..models.user import User
from ..models.content import Topic, Module, TopicProgress, Lab, LabSubmission, LabTask
from ..schemas.content import TopicCreate, TopicUpdate, TopicResponse, TopicWithProgress
from ..schemas.lab import LabResponse, LabSubmissionResponse

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, db: Session = Depends(get_db)):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


@router.get("/{topic_id}/with-progress", response_model=TopicWithProgress)
async def get_topic_with_progress(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_uuid
        )
    )
    progress = progress_result.scalar_one_or_none()

    return {
        **TopicResponse.model_validate(topic).model_dump(),
        "progress_status": progress.status if progress else "not_started",
        "best_score": progress.best_test_score if progress else None
    }


@router.post("", response_model=TopicResponse)
async def create_topic(
    topic_data: TopicCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    topic = Topic(
        module_id=topic_data.module_id,
        title=topic_data.title,
        content=topic_data.content,
        order=topic_data.order,
        has_test=topic_data.has_test,
        has_lab=topic_data.has_lab,
        passing_score=topic_data.passing_score,
        time_limit=topic_data.time_limit
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    return topic


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: str,
    topic_data: TopicUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    update_data = topic_data.model_dump(exclude_unset=True, exclude={'lab_tasks'})
    for field, value in update_data.items():
        setattr(topic, field, value)

    # Handle lab tasks
    if topic_data.lab_tasks is not None:
        # Get existing lab for this topic
        lab_result = db.execute(select(Lab).where(Lab.topic_id == topic_uuid))
        lab = lab_result.scalar_one_or_none()

        if topic.has_lab:
            # Create lab if it doesn't exist
            if not lab:
                lab = Lab(
                    topic_id=topic_uuid,
                    title=f"Лабораторная работа: {topic.title}",
                    description=f"Практическое задание по теме '{topic.title}'. Реализуйте основные концепции на примере.",
                    requirements=["1. Изучите материал темы", "2. Выполните задание", "3. Подготовьте отчет", "4. Загрузите решение"],
                    max_score=100,
                    allowed_extensions=[".py", ".txt", ".pdf", ".zip"]
                )
                db.add(lab)
                db.flush()

            # Get existing lab tasks
            existing_tasks_result = db.execute(select(LabTask).where(LabTask.lab_id == lab.id))
            existing_tasks = existing_tasks_result.scalars().all()
            existing_task_ids = {task.id for task in existing_tasks}

            # Update or create lab tasks
            for task_data in topic_data.lab_tasks:
                if task_data.get('id'):
                    # Update existing task
                    task_result = db.execute(select(LabTask).where(LabTask.id == task_data['id']))
                    task = task_result.scalar_one_or_none()
                    if task:
                        task.title = task_data['title']
                        task.description = task_data['description']
                        task.order = task_data['order']
                        task.max_score = task_data['max_score']
                        existing_task_ids.discard(task.id)
                else:
                    # Create new task
                    new_task = LabTask(
                        lab_id=lab.id,
                        title=task_data['title'],
                        description=task_data['description'],
                        order=task_data['order'],
                        max_score=task_data['max_score']
                    )
                    db.add(new_task)

            # Delete tasks that were not in the update
            for task_id in existing_task_ids:
                task_result = db.execute(select(LabTask).where(LabTask.id == task_id))
                task = task_result.scalar_one_or_none()
                if task:
                    db.delete(task)
        else:
            # Delete lab if has_lab is false
            if lab:
                # Delete lab tasks
                db.execute(select(LabTask).where(LabTask.lab_id == lab.id)).delete()
                db.delete(lab)

    db.commit()
    db.refresh(topic)

    return topic


@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()

    return {"message": "Topic deleted successfully"}


@router.post("/{topic_id}/mark-progress")
async def mark_topic_progress(
    topic_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if status not in ["not_started", "in_progress", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_uuid
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress:
        progress.status = status
        if status == "completed":
            progress.completed_at = datetime.utcnow()
    else:
        progress = TopicProgress(
            user_id=current_user.id,
            topic_id=topic_uuid,
            status=status,
            completed_at=datetime.utcnow() if status == "completed" else None
        )
        db.add(progress)

    db.commit()
    return {"message": "Progress updated"}


@router.post("/{topic_id}/upload")
async def upload_topic_file(
    topic_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Topic).where(Topic.id == topic_uuid))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    upload_dir = f"uploads/topics/{topic_uuid}"
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    new_filename = f"{file_id}{ext}"
    file_path = os.path.join(upload_dir, new_filename)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"file_url": f"/uploads/topics/{topic_uuid}/{new_filename}", "file_name": file.filename}


@router.post("/reorder")
async def reorder_topics(
    topic_orders: List[dict],
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    for item in topic_orders:
        topic_id = item.get("topic_id")
        new_order = item.get("order")
        
        try:
            topic_uuid = uuid.UUID(topic_id)
        except (ValueError, AttributeError):
            continue
        
        result = db.execute(select(Topic).where(Topic.id == topic_uuid))
        topic = result.scalar_one_or_none()
        
        if topic:
            topic.order = new_order
    
    db.commit()
    invalidate_cache("modules")
    
    return {"message": "Topics reordered successfully"}


# Lab endpoints
@router.get("/{topic_id}/lab", response_model=LabResponse)
async def get_lab(topic_id: str, db: Session = Depends(get_db)):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Lab).where(Lab.topic_id == topic_uuid))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    return lab


@router.post("/{topic_id}/lab/submit", response_model=LabSubmissionResponse)
async def submit_lab(
    topic_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(select(Lab).where(Lab.topic_id == topic_uuid))
    lab = result.scalar_one_or_none()

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    normalized_extensions = [e.lstrip(".") for e in lab.allowed_extensions]
    if ext not in normalized_extensions:
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
            TopicProgress.topic_id == topic_uuid
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress:
        if progress.status == "not_started":
            progress.status = "in_progress"
    else:
        progress = TopicProgress(
            user_id=current_user.id,
            topic_id=topic_uuid,
            status="in_progress"
        )
        db.add(progress)

    db.commit()
    db.refresh(submission)

    return submission
