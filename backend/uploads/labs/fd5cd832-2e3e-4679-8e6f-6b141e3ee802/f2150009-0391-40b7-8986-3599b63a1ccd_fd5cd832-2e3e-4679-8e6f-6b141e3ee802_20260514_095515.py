import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload  # ✅ ИСПРАВЛЕНИЕ N+1
from sqlalchemy import select
from typing import List

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.cache import get_cached, set_cached, invalidate_cache
from ..models.user import User
from ..models.content import Module, Topic, TopicProgress
from ..schemas.content import (
    ModuleCreate, ModuleUpdate, ModuleResponse,
    TopicCreate, TopicUpdate, TopicResponse, TopicWithProgress,
)

router = APIRouter(prefix="/modules", tags=["modules"])

CACHE_KEY_ALL = "modules:all"
CACHE_TTL = 3600


def _serialize_module(module: Module) -> dict:
    """Сериализация модуля с темами в dict (без полного content темы)."""
    return {
        "id": str(module.id),
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "is_published": module.is_published,
        "created_at": module.created_at.isoformat() if module.created_at else None,
        "updated_at": module.updated_at.isoformat() if module.updated_at else None,
        "topics": [
            {
                "id": str(t.id),
                "title": t.title,
                "content": "",
                "order": t.order,
                "has_test": t.has_test,
                "has_lab": t.has_lab,
                "passing_score": t.passing_score,
                "time_limit": t.time_limit,
            }
            for t in sorted(module.topics, key=lambda x: x.order)
        ],
    }


# ✅ ИСПРАВЛЕНИЕ 6: добавлена авторизация (get_current_user)
# ✅ ИСПРАВЛЕНИЕ кэша: @cache_result убран, кэш управляется вручную
# ✅ ИСПРАВЛЕНИЕ N+1: selectinload вместо цикла запросов
@router.get("", response_model=List[ModuleResponse])
async def get_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cached = await get_cached(CACHE_KEY_ALL)
    if cached:
        return cached

    result = db.execute(
        select(Module)
        .options(selectinload(Module.topics))  # ✅ один запрос вместо N+1
        .where(Module.is_published == True)
        .order_by(Module.order)
    )
    modules = result.scalars().all()
    response = [_serialize_module(m) for m in modules]

    await set_cached(CACHE_KEY_ALL, response, ttl=CACHE_TTL)
    return response


@router.get("/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Module)
        .options(selectinload(Module.topics))
        .where(Module.id == module_id)
    )
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return _serialize_module(module)


@router.post("", response_model=ModuleResponse)
async def create_module(
    module_data: ModuleCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    module = Module(
        title=module_data.title,
        description=module_data.description,
        order=module_data.order,
        is_published=module_data.is_published,
        created_by=current_user.id,
    )
    db.add(module)
    db.commit()
    db.refresh(module)

    await invalidate_cache("modules")

    return {
        "id": str(module.id),
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "is_published": module.is_published,
        "created_at": module.created_at.isoformat() if module.created_at else None,
        "updated_at": module.updated_at.isoformat() if module.updated_at else None,
        "topics": [],
    }


@router.put("/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Module).options(selectinload(Module.topics)).where(Module.id == module_id)
    )
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    update_data = module_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)

    db.commit()
    db.refresh(module)
    await invalidate_cache("modules")

    return _serialize_module(module)


@router.delete("/{module_id}")
async def delete_module(
    module_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    result = db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()
    await invalidate_cache("modules")

    return {"message": "Module deleted successfully"}
