import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.content import Lab

def fix_lab_requirements():
    db = SessionLocal()
    
    try:
        labs = db.query(Lab).all()
        
        print(f"Found {len(labs)} labs")
        
        fixed_count = 0
        for lab in labs:
            if isinstance(lab.requirements, str):
                # Convert string to list by splitting by newlines
                requirements_list = [req.strip() for req in lab.requirements.split('\n') if req.strip()]
                lab.requirements = requirements_list
                fixed_count += 1
                print(f"Fixed requirements for lab: {lab.title}")
                print(f"  Old: {lab.requirements}")
                print(f"  New: {requirements_list}")
        
        db.commit()
        print(f"Successfully fixed {fixed_count} labs")
        
    except Exception as e:
        db.rollback()
        print(f"Error fixing lab requirements: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_lab_requirements()
