from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from ..core.database import get_db
from ..core.security import get_current_user, require_role
from ..core.cache import cache_result, invalidate_cache
from ..models.user import User
from ..models.content import GlossaryTerm
from ..schemas.content import (
    GlossaryTermCreate, GlossaryTermUpdate, GlossaryTermResponse
)

router = APIRouter(prefix="/glossary", tags=["glossary"])


@router.get("", response_model=List[GlossaryTermResponse])
@cache_result(ttl=7200)
async def get_glossary_terms(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(GlossaryTerm)
    
    if category:
        query = query.where(GlossaryTerm.category == category)
    
    if search:
        query = query.where(
            GlossaryTerm.term.ilike(f"%{search}%") | 
            GlossaryTerm.definition.ilike(f"%{search}%")
        )
    
    query = query.order_by(GlossaryTerm.term)
    result = db.execute(query)
    terms = result.scalars().all()
    
    return terms


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    result = db.execute(select(GlossaryTerm.category).distinct())
    categories = [c[0] for c in result.all() if c[0]]
    return categories


@router.get("/{term_id}", response_model=GlossaryTermResponse)
async def get_glossary_term(term_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(GlossaryTerm).where(GlossaryTerm.id == term_id))
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    return term


@router.post("", response_model=GlossaryTermResponse)
async def create_glossary_term(
    term_data: GlossaryTermCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    existing = db.execute(
        select(GlossaryTerm).where(GlossaryTerm.term == term_data.term)
    ).scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Term already exists")
    
    term = GlossaryTerm(
        term=term_data.term,
        definition=term_data.definition,
        category=term_data.category
    )
    db.add(term)
    db.commit()
    db.refresh(term)
    
    invalidate_cache("glossary")
    
    return term


@router.put("/{term_id}", response_model=GlossaryTermResponse)
async def update_glossary_term(
    term_id: str,
    term_data: GlossaryTermUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(GlossaryTerm).where(GlossaryTerm.id == term_id))
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    update_data = term_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(term, field, value)
    
    db.commit()
    db.refresh(term)
    
    invalidate_cache("glossary")
    
    return term


@router.delete("/{term_id}")
async def delete_glossary_term(
    term_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db)
):
    result = db.execute(select(GlossaryTerm).where(GlossaryTerm.id == term_id))
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    db.delete(term)
    db.commit()
    
    invalidate_cache("glossary")
    
    return {"message": "Term deleted successfully"}
