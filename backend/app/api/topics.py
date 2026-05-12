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
from ..models.content import Topic, Module
from ..schemas.content import TopicCreate, TopicUpdate, TopicResponse, TopicWithProgress

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Topic).where(Topic.id == topic_id))
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
    result = db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_id
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
    result = db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    update_data = topic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)

    return topic


@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Topic).where(Topic.id == topic_id))
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

    result = db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    progress_result = db.execute(
        select(TopicProgress).where(
            TopicProgress.user_id == current_user.id,
            TopicProgress.topic_id == topic_id
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
            topic_id=topic_id,
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
    result = db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    upload_dir = f"uploads/topics/{topic_id}"
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    new_filename = f"{file_id}{ext}"
    file_path = os.path.join(upload_dir, new_filename)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"file_url": f"/uploads/topics/{topic_id}/{new_filename}", "file_name": file.filename}


@router.post("/reorder")
async def reorder_topics(
    topic_orders: List[dict],
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    for item in topic_orders:
        topic_id = item.get("topic_id")
        new_order = item.get("order")
        
        result = db.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        
        if topic:
            topic.order = new_order
    
    db.commit()
    invalidate_cache("modules")
    
    return {"message": "Topics reordered successfully"}
