from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        # Load the model ONCE when the service is created, not per-call.
        # This is expensive (loads weights into memory) - must be a singleton.
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def generate_embedding(self, text: str) -> list[float]:
        embedding = self.model.encode(text)
        return embedding.tolist()  # convert numpy array to plain Python list for DB storage

    def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        # Batch encoding is significantly faster than calling generate_embedding() in a loop,
        # since the model can process multiple texts together on CPU/GPU.
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

embedding_service = EmbeddingService()