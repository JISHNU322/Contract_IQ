from google import genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.search_service import search_service

client = genai.Client(api_key=settings.GEMINI_API_KEY)


class RAGService:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"

    def answer_question(
        self,
        db: Session,
        question: str,
        user_id: int,
        user_role: str,
        contract_id: int | None = None,
        top_k: int = 5,
    ) -> dict:
        retrieved_chunks = search_service.search_similar_chunks(
            db=db,
            query=question,
            user_id=user_id,
            user_role=user_role,
            contract_id=contract_id,
            top_k=top_k,
        )

        if not retrieved_chunks:
            return {
                "answer": "I couldn't find any relevant information in your contracts to answer this question.",
                "citations": [],
            }

        context_blocks = "\n\n".join(
            f"[Chunk {c['chunk_id']} | Contract {c['contract_id']}]\n{c['chunk_text']}"
            for c in retrieved_chunks
        )

        prompt = f"""You are a contract analysis assistant. Answer the user's question using ONLY the contract excerpts provided below.

Rules:
- If the answer is not contained in the excerpts, say "I don't have enough information in the available contracts to answer this."
- Do not use outside knowledge or make assumptions beyond what is stated.
- Be precise and reference specific terms (dates, amounts, durations) exactly as written in the excerpts.
- Keep your answer concise.

Contract excerpts:
{context_blocks}

Question: {question}

Answer:"""

        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        return {
            "answer": response.text,
            "citations": retrieved_chunks,
        }


rag_service = RAGService()