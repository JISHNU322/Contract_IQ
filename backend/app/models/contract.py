from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.user import User

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded")  # uploaded | processing | parsed | failed
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    uploaded_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    parsed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationship to user
    uploaded_by: Mapped[User] = relationship("User", backref="contracts")
