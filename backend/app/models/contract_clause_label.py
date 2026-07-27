from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.contract_chunk import ContractChunk


class ContractClauseLabel(Base):
    __tablename__ = "contract_clause_labels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    chunk_id: Mapped[int] = mapped_column(Integer, ForeignKey("contract_chunks.id"), nullable=False)
    clause_type: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    chunk: Mapped[ContractChunk] = relationship("ContractChunk", backref="clause_labels")