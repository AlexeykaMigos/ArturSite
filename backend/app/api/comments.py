from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.content import Comment
from ..schemas.progress import CommentBase, CommentCreate, CommentResponse

router = APIRouter(prefix="/topics", tags=["comments"])


@router.get("/{topic_id}/comments", response_model=List[CommentResponse])
async def get_topic_comments(topic_id: str, db: Session = Depends(get_db)):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    result = db.execute(
        select(Comment)
        .where(Comment.topic_id == topic_uuid, Comment.parent_id == None)
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    
    # Load replies for each comment
    comments_with_replies = []
    for comment in comments:
        replies_result = db.execute(
            select(Comment)
            .where(Comment.parent_id == comment.id)
            .order_by(Comment.created_at.asc())
        )
        replies = replies_result.scalars().all()
        
        comment_dict = {
            "id": str(comment.id),
            "topic_id": str(comment.topic_id),
            "user_id": str(comment.user_id),
            "content": comment.content,
            "parent_id": comment.parent_id,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "user": {
                "name": comment.user.name if comment.user else "Unknown",
                "avatar_url": comment.user.avatar_url if comment.user else None
            },
            "replies": [
                {
                    "id": str(r.id),
                    "topic_id": str(r.topic_id),
                    "user_id": str(r.user_id),
                    "content": r.content,
                    "parent_id": r.parent_id,
                    "created_at": r.created_at,
                    "updated_at": r.updated_at,
                    "user": {
                        "name": r.user.name if r.user else "Unknown",
                        "avatar_url": r.user.avatar_url if r.user else None
                    }
                }
                for r in replies
            ]
        }
        comments_with_replies.append(comment_dict)
    
    return comments_with_replies


@router.post("/{topic_id}/comments", response_model=CommentResponse)
async def create_comment(
    topic_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        topic_uuid = uuid.UUID(topic_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid topic ID")
    
    comment = Comment(
        topic_id=topic_uuid,
        user_id=current_user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {
        "id": str(comment.id),
        "topic_id": str(comment.topic_id),
        "user_id": str(comment.user_id),
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": {
            "name": current_user.name,
            "avatar_url": current_user.avatar_url
        }
    }


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        comment_uuid = uuid.UUID(comment_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid comment ID")
    
    result = db.execute(select(Comment).where(Comment.id == comment_uuid))
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")
    
    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    
    return {
        "id": str(comment.id),
        "topic_id": str(comment.topic_id),
        "user_id": str(comment.user_id),
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": {
            "name": current_user.name,
            "avatar_url": current_user.avatar_url
        }
    }


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        comment_uuid = uuid.UUID(comment_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid comment ID")
    
    result = db.execute(select(Comment).where(Comment.id == comment_uuid))
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Delete replies first
    replies_result = db.execute(select(Comment).where(Comment.parent_id == comment_uuid))
    replies = replies_result.scalars().all()
    for reply in replies:
        db.delete(reply)
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}
