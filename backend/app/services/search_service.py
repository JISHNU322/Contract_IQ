from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.contract_chunk import ContractChunk
from app.models.contract import Contract
from app.services.embedding_service import embedding_service


class SearchService:
    def search_similar_chunks(
        self,
        db: Session,
        query: str,
        user_id: int,
        user_role: str,
        contract_id: int | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Embeds the query and finds the top_k most similar chunks using pgvector
        cosine distance search. Restricted to contracts the user can access.
        """
        query_embedding = embedding_service.generate_embedding(query)

        stmt = (
            select(
                ContractChunk,
                ContractChunk.embedding.cosine_distance(query_embedding).label("distance"),
            )
            .join(Contract, ContractChunk.contract_id == Contract.id)
        )

        # Access control: viewers only see their own contracts; admins/reviewers see all
        if user_role not in ["admin", "legal_reviewer"]:
            stmt = stmt.where(Contract.uploaded_by_id == user_id)

        # Optionally restrict to one specific contract
        if contract_id is not None:
            stmt = stmt.where(ContractChunk.contract_id == contract_id)

        stmt = stmt.order_by("distance").limit(top_k)

        results = db.execute(stmt).all()

        return [
            {
                "chunk_id": chunk.id,
                "contract_id": chunk.contract_id,
                "chunk_text": chunk.chunk_text,
                "similarity": 1 - distance,  # convert distance to similarity (0-1, higher = more similar)
            }
            for chunk, distance in results
        ]


search_service = SearchService()