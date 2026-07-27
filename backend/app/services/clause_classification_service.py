from transformers import pipeline

# Fixed set of clause categories we classify chunks into.
# Zero-shot classification reasons about these labels directly - no training needed.
CLAUSE_LABELS = [
    "Termination",
    "Confidentiality",
    "Payment",
    "Liability",
    "Governing Law",
    "Intellectual Property",
    "Parties and Definitions",
    "Dispute Resolution",
]

CONFIDENCE_THRESHOLD = 0.4  # discard classifications below this - likely noise


class ClauseClassificationService:
    def __init__(self):
        # Loaded once at startup - this model is much larger than the embedding
        # model, so this call will take longer and download ~1.6GB on first run.
        self.classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
        )

    def classify_clause(self, chunk_text: str) -> dict | None:
        if not chunk_text or not chunk_text.strip():
            return None

        result = self.classifier(chunk_text, candidate_labels=CLAUSE_LABELS)

        top_label = result["labels"][0]
        top_score = result["scores"][0]

        if top_score < CONFIDENCE_THRESHOLD:
            return None

        return {
            "clause_type": top_label,
            "confidence_score": top_score,
        }


clause_classification_service = ClauseClassificationService()