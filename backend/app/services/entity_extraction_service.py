import spacy

# Entity types worth keeping for contract analysis - filters out spaCy's
# other categories (like CARDINAL, ORDINAL, etc.) that aren't useful here
RELEVANT_ENTITY_TYPES = {"ORG", "PERSON", "DATE", "MONEY", "GPE"}


class EntityExtractionService:
    def __init__(self):
        # Load once at startup - loading per-call would be extremely slow
        self.nlp = spacy.load("en_core_web_sm")

    def extract_entities(self, text: str) -> list[dict]:
        if not text or not text.strip():
            return []

        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            if ent.label_ in RELEVANT_ENTITY_TYPES:
                entities.append({
                    "entity_type": ent.label_,
                    "entity_text": ent.text.strip(),
                })
        return entities


entity_extraction_service = EntityExtractionService()