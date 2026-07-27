import re

class ChunkingService:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size      # target chunk size, in characters (simple proxy for tokens)
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> list[str]:
        if not text or not text.strip():
            return []

        # Step 1: split on natural paragraph/clause boundaries first
        # Contracts often have numbered clauses separated by newlines
        paragraphs = re.split(r"\n+", text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            # If adding this paragraph would exceed chunk_size, finalize current chunk first
            if len(current_chunk) + len(para) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                # Start next chunk with word-safe overlap from the end of the previous one
                overlap_text = self._get_word_safe_overlap(current_chunk)
                current_chunk = overlap_text + " " + para
            else:
                current_chunk += " " + para if current_chunk else para

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _get_word_safe_overlap(self, text: str) -> str:
        """Takes roughly the last `chunk_overlap` characters, but snaps
        to the nearest word boundary so we never cut a word in half."""
        if not self.chunk_overlap or len(text) <= self.chunk_overlap:
            return text
        raw_overlap = text[-self.chunk_overlap:]
        # Drop any partial word at the very start of the slice
        first_space = raw_overlap.find(" ")
        if first_space == -1:
            return raw_overlap
        return raw_overlap[first_space + 1:]

chunking_service = ChunkingService()