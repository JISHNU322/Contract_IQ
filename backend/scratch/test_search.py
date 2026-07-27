from app.core.database import SessionLocal
from app.services.search_service import search_service

db = SessionLocal()
results = search_service.search_similar_chunks(
    db=db,
    query="What is the termination notice period?",
    user_id=2,
    user_role="viewer",
    top_k=3,
)
for r in results:
    print(f"Chunk {r['chunk_id']} (similarity: {r['similarity']:.3f}): {r['chunk_text'][:100]}")
db.close()