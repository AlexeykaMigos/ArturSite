import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
from app.core.database import SessionLocal
from app.models.user import User

def create_test_users():
    db = SessionLocal()
    
    test_users = [
        {
            "name": "Иван Иванов",
            "email": "student@test.com",
            "password": "student123",
            "role": "student"
        },
        {
            "name": "Петр Петров",
            "email": "teacher@test.com",
            "password": "teacher123",
            "role": "teacher"
        },
        {
            "name": "Сидор Сидоров",
            "email": "admin@test.com",
            "password": "admin123",
            "role": "admin"
        },
        {
            "name": "Анна Смирнова",
            "email": "student2@test.com",
            "password": "student123",
            "role": "student"
        },
        {
            "name": "Мария Кузнецова",
            "email": "student3@test.com",
            "password": "student123",
            "role": "student"
        }
    ]
    
    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            continue
        
        # Hash password using bcrypt directly
        password_bytes = user_data["password"].encode('utf-8')
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password_hash=hashed_password,
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        print(f"Created user: {user_data['email']} ({user_data['role']})")
    
    db.commit()
    db.close()
    print("\nTest users created successfully!")

if __name__ == "__main__":
    create_test_users()
