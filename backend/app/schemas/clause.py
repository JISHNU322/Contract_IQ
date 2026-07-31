from pydantic import BaseModel

class ClauseOut(BaseModel):
    id: int
    chunk_id: int
    clause_type: str
    confidence_score: float
    chunk_text: str | None = None

    class Config:
        from_attributes = True