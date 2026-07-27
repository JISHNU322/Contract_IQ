from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class AuthService:
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        db_user = User(
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
            full_name=user_in.full_name,
            is_active=True,
            role="viewer",  # always default to lowest privilege on self-registration, regardless of client input
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def update_user(self, db: Session, db_user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data:
            if update_data["password"]:
                db_user.hashed_password = hash_password(update_data["password"])
            del update_data["password"]

        # Prevent privilege escalation via update endpoint too
        update_data.pop("role", None)

        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

auth_service = AuthService()