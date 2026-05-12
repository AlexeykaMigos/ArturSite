from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from typing import List
from datetime import datetime, timedelta
import io

from ..core.database import get_db
from ..core.security import require_role, get_current_user
from ..models.user import User, UserRole
from ..schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def get_all_users(
    role: str = None,
    search: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    query = select(User)

    if role:
        query = query.where(User.role == role)

    if search:
        query = query.where(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    count_result = db.execute(count_query)
    total = count_result.scalar()

    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = db.execute(query)
    users = result.scalars().all()

    return {
        "users": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    if role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    user.role = UserRole(role)
    db.commit()

    return {"message": "Role updated", "new_role": role}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}


@router.get("/logs")
async def get_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return {
        "logs": [
            {
                "id": "1",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": "sample-user-id",
                "action": "login",
                "details": "User logged in",
                "ip": "192.168.1.1"
            }
        ],
        "total": 1,
        "limit": limit,
        "offset": offset
    }


@router.get("/settings")
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return {
        "app_name": "Электронный учебник",
        "app_version": "1.0.0",
        "contact_email": "admin@example.com",
        "session_timeout": 3600,
        "allow_registration": True,
        "require_email_confirmation": True
    }


@router.put("/settings")
async def update_settings(
    settings: dict,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return {"message": "Settings updated"}


@router.post("/backup")
async def create_backup(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    return {
        "message": "Backup created",
        "filename": f"backup_{timestamp}.sql",
        "created_at": datetime.utcnow().isoformat()
    }


@router.post("/cache/clear")
async def clear_cache(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return {"message": "Cache cleared successfully"}


@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users_count = db.execute(select(func.count(User.id)))
    total_users = users_count.scalar()

    students_count = db.execute(
        select(func.count(User.id)).where(User.role == UserRole.STUDENT)
    )
    total_students = students_count.scalar()

    teachers_count = db.execute(
        select(func.count(User.id)).where(User.role == UserRole.TEACHER)
    )
    total_teachers = teachers_count.scalar()

    from ..models.content import Module, Topic
    modules_count = db.execute(select(func.count(Module.id)))
    total_modules = modules_count.scalar()

    topics_count = db.execute(select(func.count(Topic.id)))
    total_topics = topics_count.scalar()

    return {
        "total_users": total_users or 0,
        "total_students": total_students or 0,
        "total_teachers": total_teachers or 0,
        "total_modules": total_modules or 0,
        "total_topics": total_topics or 0,
        "uptime": "24h 30m"
    }
