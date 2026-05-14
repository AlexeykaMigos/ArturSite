from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class ProgressBase(BaseModel):
    status: str = "not_started"
    best_test_score: Optional[int] = None


class TopicProgressResponse(BaseModel):
    topic_id: UUID
    status: str
    best_test_score: Optional[int]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class OverallProgress(BaseModel):
    total_topics: int
    completed_topics: int
    in_progress_topics: int
    percentage: int
    modules: List[dict]

    class Config:
        from_attributes = True


class TopicStats(BaseModel):
    topic_id: UUID
    topic_title: str
    module_title: str
    best_score: Optional[int]
    attempts: int
    last_attempt: Optional[datetime]

    class Config:
        from_attributes = True


class StudentStats(BaseModel):
    total_topics: int
    completed_topics: int
    average_score: float
    total_tests_taken: int
    labs_completed: int
    labs_pending: int

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str
    parent_id: Optional[UUID] = None


class CommentCreate(CommentBase):
    pass


class CommentUserInfo(BaseModel):
    name: str
    avatar_url: Optional[str] = None


class CommentResponse(BaseModel):
    id: UUID
    topic_id: UUID
    user_id: UUID
    content: str
    parent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: CommentUserInfo
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()