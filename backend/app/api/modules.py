from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.cache import cache_result, invalidate_cache
from ..models.user import User
from ..models.content import Module, Topic, TopicProgress
from ..schemas.content import (
    ModuleCreate, ModuleUpdate, ModuleResponse,
    TopicCreate, TopicUpdate, TopicResponse, TopicWithProgress
)

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("", response_model=List[ModuleResponse])
@cache_result(ttl=3600)
async def get_modules(db: Session = Depends(get_db)):
    modules_result = db.execute(
        select(Module).where(Module.is_published == True).order_by(Module.order)
    )
    modules = modules_result.scalars().all()

    if not modules:
        return []

    # Single query for all topics across all modules
    module_ids = [m.id for m in modules]
    topics_result = db.execute(
        select(Topic).where(Topic.module_id.in_(module_ids)).order_by(Topic.order)
    )
    all_topics = topics_result.scalars().all()

    # Group by module
    topics_by_module: dict = {}
    for t in all_topics:
        topics_by_module.setdefault(t.module_id, []).append(t)

    response = []
    for module in modules:
        topics = topics_by_module.get(module.id, [])
        response.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order,
            "is_published": module.is_published,
            "created_at": module.created_at,
            "updated_at": module.updated_at,
            "topics": [
                {
                    "id": t.id,
                    "title": t.title,
                    "content": "",
                    "order": t.order,
                    "has_test": t.has_test,
                    "has_lab": t.has_lab,
                    "passing_score": t.passing_score,
                    "time_limit": t.time_limit
                }
                for t in topics
            ]
        })

    return response


@router.get("/{module_id}", response_model=ModuleResponse)
async def get_module(module_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    topics_result = db.execute(
        select(Topic).where(Topic.module_id == module.id).order_by(Topic.order)
    )
    topics = topics_result.scalars().all()

    return {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "is_published": module.is_published,
        "created_at": module.created_at,
        "updated_at": module.updated_at,
        "topics": [
            {
                "id": t.id,
                "title": t.title,
                "content": "",
                "order": t.order,
                "has_test": t.has_test,
                "has_lab": t.has_lab,
                "passing_score": t.passing_score,
                "time_limit": t.time_limit
            }
            for t in topics
        ]
    }


@router.post("", response_model=ModuleResponse)
async def create_module(
    module_data: ModuleCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    module = Module(
        title=module_data.title,
        description=module_data.description,
        order=module_data.order,
        is_published=module_data.is_published,
        created_by=current_user.id
    )
    db.add(module)
    db.commit()
    db.refresh(module)

    invalidate_cache("modules")

    return {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "is_published": module.is_published,
        "created_at": module.created_at,
        "updated_at": module.updated_at,
        "topics": []
    }


@router.put("/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    update_data = module_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)

    db.commit()
    db.refresh(module)

    invalidate_cache("modules")

    topics_result = db.execute(
        select(Topic).where(Topic.module_id == module.id).order_by(Topic.order)
    )
    topics = topics_result.scalars().all()

    return {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "is_published": module.is_published,
        "created_at": module.created_at,
        "updated_at": module.updated_at,
        "topics": [
            {
                "id": t.id,
                "title": t.title,
                "content": "",
                "order": t.order,
                "has_test": t.has_test,
                "has_lab": t.has_lab,
                "passing_score": t.passing_score,
                "time_limit": t.time_limit
            }
            for t in topics
        ]
    }


@router.delete("/{module_id}")
async def delete_module(
    module_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()

    invalidate_cache("modules")

    return {"message": "Module deleted successfully"}