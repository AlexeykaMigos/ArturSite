from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserRole:
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    is_email_confirmed: bool
    group_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserInList(UserResponse):
    pass


class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str


class GroupCreate(BaseModel):
    name: str


class GroupResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True