from pydantic import BaseModel


class RiskOut(BaseModel):
    risk_type: str
    severity: str
    description: str
    related_chunk_id: int | None

    class Config:
        from_attributes = True