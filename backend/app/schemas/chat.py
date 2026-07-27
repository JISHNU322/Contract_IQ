from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class Citation(BaseModel):
    chunk_id: int
    contract_id: int
    chunk_text: str
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]