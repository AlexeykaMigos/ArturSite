import secrets
import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional

from ..core.database import get_db
from ..core.config import settings
from ..core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from ..models.user import User, RefreshToken, PasswordResetToken
from ..schemas.user import (
    UserCreate, UserResponse, UserPasswordUpdate, UserUpdate,
    ForgotPasswordRequest, ResetPasswordRequest
)
from ..core.email import email_service

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_reset_token(token: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        token.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.email == user_data.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        is_email_confirmed=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User created successfully", "user_id": str(user.id)}


@router.post("/login")
async def login(response: Response, email: str, password: str, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    expires_at = datetime.utcnow() + timedelta(days=7)
    db_token = RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at)
    db.add(db_token)
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token))
    stored_token = result.scalar_one_or_none()

    if not stored_token or stored_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired or revoked")

    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if refresh_token:
        result = db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token))
        token = result.scalar_one_or_none()
        if token:
            db.delete(token)
            db.commit()

    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me")
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.email:
        existing = db.execute(
            select(User).where(User.email == user_update.email, User.id != current_user.id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/me/password")
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If email exists, reset link was sent"}

    reset_token = secrets.token_urlsafe(32)
    reset_token_hash = hash_reset_token(reset_token)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    db_token = PasswordResetToken(
        user_id=user.id,
        token=reset_token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={reset_token}"
    email_service.send_email(
        to_email=user.email,
        subject="Восстановление пароля",
        html_content=(
            f"<p>Здравствуйте, {user.name}!</p>"
            f"<p>Для сброса пароля перейдите по ссылке:</p>"
            f"<p><a href='{reset_link}'>{reset_link}</a></p>"
            f"<p>Ссылка действительна 1 час.</p>"
        )
    )

    return {"message": "If email exists, reset link was sent"}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_reset_token(payload.token)
    result = db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token_hash)
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    if reset_token.used_at is not None:
        raise HTTPException(status_code=400, detail="Reset token already used")
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token expired")

    user_result = db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user.password_hash = get_password_hash(payload.new_password)
    reset_token.used_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successful"}
