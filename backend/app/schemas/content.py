from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    is_published: bool = True


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None


class TopicBase(BaseModel):
    title: str
    content: str
    order: int = 0
    has_test: bool = True
    has_lab: bool = False
    passing_score: int = 70
    time_limit: Optional[int] = None


class TopicCreate(TopicBase):
    module_id: UUID


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None
    has_test: Optional[bool] = None
    has_lab: Optional[bool] = None
    passing_score: Optional[int] = None
    time_limit: Optional[int] = None
    lab_tasks: Optional[List[dict]] = None


class TopicInModule(TopicBase):
    id: UUID
    order: int

    class Config:
        from_attributes = True


class ModuleResponse(ModuleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    topics: List[TopicInModule] = []

    class Config:
        from_attributes = True


class TopicResponse(TopicBase):
    id: UUID
    module_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TopicWithProgress(TopicResponse):
    progress_status: str = "not_started"
    best_score: Optional[int] = None


class GlossaryTermBase(BaseModel):
    term: str
    definition: str
    category: Optional[str] = None


class GlossaryTermCreate(GlossaryTermBase):
    pass


class GlossaryTermUpdate(BaseModel):
    term: Optional[str] = None
    definition: Optional[str] = None
    category: Optional[str] = None


class GlossaryTermResponse(GlossaryTermBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True