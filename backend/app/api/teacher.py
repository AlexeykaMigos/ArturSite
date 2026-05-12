from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from typing import List, Optional
import io
from openpyxl import Workbook

from ..core.database import get_db
from ..core.security import require_role
from ..models.user import User, UserRole
from ..models.content import Module, Topic, Test, LabSubmission, TopicProgress, TestAttempt
from ..schemas.user import UserCreate, UserResponse

router = APIRouter(
    prefix="/teacher",
    tags=["teacher"],
    dependencies=[Depends(require_role("teacher", "admin"))]
)


@router.get("/students")
async def get_students(
    group_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query = select(User).where(User.role == UserRole.STUDENT)

    if group_id:
        query = query.where(User.group_id == group_id)

    if search:
        query = query.where(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    count_result = db.execute(count_query)
    total = count_result.scalar()

    query = query.order_by(User.name).offset((page - 1) * page_size).limit(page_size)
    result = db.execute(query)
    students = result.scalars().all()

    student_list = []
    for s in students:
        attempts_result = db.execute(
            select(func.avg(TestAttempt.score))
            .where(TestAttempt.user_id == s.id)
        )
        avg_score = attempts_result.scalar()

        completed_result = db.execute(
            select(func.count(TopicProgress.id))
            .where(TopicProgress.user_id == s.id, TopicProgress.status == "completed")
        )
        completed = completed_result.scalar()

        student_list.append({
            "id": str(s.id),
            "name": s.name,
            "email": s.email,
            "group_id": str(s.group_id) if s.group_id else None,
            "is_active": s.is_active,
            "average_score": round(float(avg_score), 1) if avg_score else None,
            "completed_topics": completed or 0
        })

    return {
        "students": student_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/students")
async def create_student(
    student_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing = db.execute(select(User).where(User.email == student_data.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    from ..core.security import get_password_hash

    student = User(
        email=student_data.email,
        name=student_data.name,
        password_hash=get_password_hash(student_data.password),
        role=UserRole.STUDENT,
        is_email_confirmed=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {"id": str(student.id), "email": student.email, "name": student.name}


@router.post("/students/import")
async def import_students(
    students: List[UserCreate],
    db: Session = Depends(get_db)
):
    created = []
    errors = []

    for i, s in enumerate(students):
        existing = db.execute(select(User).where(User.email == s.email)).scalar_one_or_none()
        if existing:
            errors.append({"index": i, "email": s.email, "error": "Email already exists"})
            continue

        from ..core.security import get_password_hash

        student = User(
            email=s.email,
            name=s.name,
            password_hash=get_password_hash(s.password),
            role=UserRole.STUDENT,
            is_email_confirmed=True
        )
        db.add(student)
        created.append(s.email)

    db.commit()

    return {"created": len(created), "errors": errors}


@router.get("/students/{student_id}/progress")
async def get_student_progress(
    student_id: str,
    db: Session = Depends(get_db)
):
    result = db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    modules_result = db.execute(select(Module).order_by(Module.order))
    modules = modules_result.scalars().all()

    progress_data = []
    for module in modules:
        topics_result = db.execute(select(Topic).where(Topic.module_id == module.id))
        topics = topics_result.scalars().all()

        topics_data = []
        for topic in topics:
            progress_result = db.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == student.id,
                    TopicProgress.topic_id == topic.id
                )
            )
            progress = progress_result.scalar_one_or_none()

            test_result = db.execute(
                select(TestAttempt)
                .where(TestAttempt.user_id == student.id, TestAttempt.topic_id == topic.id)
                .order_by(TestAttempt.score.desc())
                .limit(1)
            )
            best_test = test_result.scalar_one_or_none()

            topics_data.append({
                "topic_id": str(topic.id),
                "title": topic.title,
                "status": progress.status if progress else "not_started",
                "best_test_score": progress.best_test_score if progress else None,
                "test_passed": best_test.passed if best_test else False,
                "has_lab": topic.has_lab
            })

        progress_data.append({
            "module_id": str(module.id),
            "title": module.title,
            "topics": topics_data
        })

    return {
        "student_id": student_id,
        "student_name": student.name,
        "modules": progress_data
    }


@router.get("/stats/overview")
async def get_stats_overview(db: Session = Depends(get_db)):
    total_students_result = db.execute(
        select(func.count(User.id)).where(User.role == UserRole.STUDENT)
    )
    total_students = total_students_result.scalar()

    students_result = db.execute(select(User).where(User.role == UserRole.STUDENT))
    students = students_result.scalars().all()

    total_topics_result = db.execute(select(func.count(Topic.id)))
    total_topics = total_topics_result.scalar()

    progress_data = []
    for s in students:
        completed_result = db.execute(
            select(func.count(TopicProgress.id))
            .where(TopicProgress.user_id == s.id, TopicProgress.status == "completed")
        )
        completed = completed_result.scalar() or 0
        progress = int((completed / total_topics * 100) if total_topics > 0 else 0)
        progress_data.append({"student_id": str(s.id), "name": s.name, "progress": progress})

    struggling = [p for p in progress_data if p["progress"] < 50]

    avg_progress = sum(p["progress"] for p in progress_data) / len(progress_data) if progress_data else 0

    lab_stats_result = db.execute(
        select(LabSubmission.status, func.count(LabSubmission.id))
        .group_by(LabSubmission.status)
    )
    lab_stats = {row[0]: row[1] for row in lab_stats_result.all()}

    return {
        "total_students": total_students,
        "average_progress": round(avg_progress, 1),
        "struggling_students": struggling[:10],
        "lab_stats": lab_stats,
        "total_topics": total_topics
    }


@router.get("/export/report")
async def export_report(
    group_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(User).where(User.role == UserRole.STUDENT)
    if group_id:
        query = query.where(User.group_id == group_id)

    result = db.execute(query)
    students = result.scalars().all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Report"

    ws.append(["Student", "Email", "Completed Topics", "Average Score", "Labs Approved", "Labs Pending"])

    total_topics_result = db.execute(select(func.count(Topic.id)))
    total_topics = total_topics_result.scalar()

    for s in students:
        attempts_result = db.execute(
            select(func.avg(TestAttempt.score))
            .where(TestAttempt.user_id == s.id)
        )
        avg_score = attempts_result.scalar() or 0

        completed_result = db.execute(
            select(func.count(TopicProgress.id))
            .where(TopicProgress.user_id == s.id, TopicProgress.status == "completed")
        )
        completed = completed_result.scalar() or 0

        lab_approved_result = db.execute(
            select(func.count(LabSubmission.id))
            .where(LabSubmission.user_id == s.id, LabSubmission.status == "approved")
        )
        lab_approved = lab_approved_result.scalar() or 0

        lab_pending_result = db.execute(
            select(func.count(LabSubmission.id))
            .where(LabSubmission.user_id == s.id, LabSubmission.status == "pending")
        )
        lab_pending = lab_pending_result.scalar() or 0

        ws.append([s.name, s.email, f"{completed}/{total_topics}", round(float(avg_score), 1), lab_approved, lab_pending])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(stream.getvalue()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=report.xlsx"}
    )


@router.put("/students/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    db: Session = Depends(get_db)
):
    result = db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from ..core.security import get_password_hash
    import secrets

    temp_password = secrets.token_urlsafe(8)
    student.password_hash = get_password_hash(temp_password)
    db.commit()

    return {"temp_password": temp_password}


@router.put("/students/{student_id}/toggle-active")
async def toggle_student_active(
    student_id: str,
    db: Session = Depends(get_db)
):
    result = db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.is_active = not student.is_active
    db.commit()

    return {"is_active": student.is_active}
