from pydantic import BaseModel

class EntityOut(BaseModel):
    id: int
    contract_id: int
    entity_type: str
    entity_text: str

    class Config:
        from_attributes = True