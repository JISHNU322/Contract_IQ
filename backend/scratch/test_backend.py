import os
import sys

# Ensure backend folder is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.schemas.user import UserCreate
from app.services.auth_service import auth_service

def test_flow():
    print("Starting backend integration verification...")
    
    # 1. Open Database Session
    db = SessionLocal()
    try:
        # Check if test user already exists, clean up if so
        email = "test@example.com"
        existing_user = auth_service.get_user_by_email(db, email=email)
        if existing_user:
            print(f"Cleaning up existing user: {email}")
            db.delete(existing_user)
            db.commit()
            
        # 2. Create a test user
        print("Creating test user...")
        user_in = UserCreate(
            email=email,
            password="testpassword123",
            full_name="Test User",
            is_active=True,
            is_superuser=False
        )
        user = auth_service.create_user(db, user_in=user_in)
        print(f"User created: {user.email} (ID: {user.id})")
        assert user.id is not None
        assert user.email == email
        
        # 3. Authenticate user with correct password
        print("Authenticating user with correct password...")
        auth_user = auth_service.authenticate(db, email=email, password="testpassword123")
        assert auth_user is not None, "Authentication failed!"
        print("Authentication successful!")
        
        # 4. Authenticate user with incorrect password
        print("Authenticating user with incorrect password...")
        bad_auth = auth_service.authenticate(db, email=email, password="wrongpassword")
        assert bad_auth is None, "Authentication should have failed but succeeded!"
        print("Authentication correctly failed for wrong password!")
        
        # Clean up
        print("Cleaning up test user...")
        db.delete(user)
        db.commit()
        print("All database and auth service checks passed!")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
