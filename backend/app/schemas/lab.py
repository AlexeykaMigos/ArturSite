from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class LabTaskResponse(BaseModel):
    id: UUID
    title: str
    description: str
    order: int
    max_score: int

    class Config:
        from_attributes = True


class LabBase(BaseModel):
    title: str
    description: str
    requirements: Optional[List[str]] = []
    max_score: int = 100
    allowed_extensions: List[str] = ["pdf", "docx", "zip", "rar"]


class LabCreate(LabBase):
    topic_id: UUID


class LabUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    max_score: Optional[int] = None
    allowed_extensions: Optional[List[str]] = None


class LabResponse(LabBase):
    id: UUID
    topic_id: UUID
    created_at: datetime
    tasks: List[LabTaskResponse] = []

    class Config:
        from_attributes = True


class LabSubmissionResponse(BaseModel):
    id: UUID
    lab_id: UUID
    user_id: UUID
    file_name: str
    status: str
    grade: Optional[int] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LabSubmissionCreate(BaseModel):
    pass


class LabSubmissionGrade(BaseModel):
    grade: int
    feedback: Optional[str] = None


class StudentLabSubmission(LabSubmissionResponse):
    topic_title: Optional[str] = None


class TeacherLabView(LabSubmissionResponse):
    student_name: str
    student_email: str
    topic_title: str
    lab_title: str


class LabSubmissionList(BaseModel):
    submissions: List[TeacherLabView]
    total: int
    page: int
    page_size: int