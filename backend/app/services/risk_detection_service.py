from google import genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.contract_chunk import ContractChunk
from app.models.contract_clause_label import ContractClauseLabel
from app.models.contract_risk import ContractRisk

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Clause types a standard commercial contract should typically have.
# Anything missing from this list (based on Phase 5 classification) is
# flagged as a structural risk - zero LLM cost, purely deterministic.
EXPECTED_CLAUSE_TYPES = [
    "Termination",
    "Confidentiality",
    "Payment",
    "Liability",
    "Governing Law",
]


class RiskDetectionService:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"

    def detect_risks(self, db: Session, contract_id: int) -> list[dict]:
        risks = []

        # --- Step 1: Missing clause detection (rule-based, no LLM) ---
        existing_labels = (
            db.query(ContractClauseLabel.clause_type)
            .join(ContractChunk, ContractClauseLabel.chunk_id == ContractChunk.id)
            .filter(ContractChunk.contract_id == contract_id)
            .distinct()
            .all()
        )
        existing_clause_types = {label[0] for label in existing_labels}

        for expected in EXPECTED_CLAUSE_TYPES:
            if expected not in existing_clause_types:
                risks.append({
                    "risk_type": "Missing Clause",
                    "severity": "medium",
                    "description": f"The contract does not appear to contain a '{expected}' clause, which is standard in commercial agreements.",
                    "related_chunk_id": None,
                })

        # --- Step 2: Qualitative risk detection on existing clauses (LLM-based) ---
        chunks_with_labels = (
            db.query(ContractChunk, ContractClauseLabel)
            .join(ContractClauseLabel, ContractClauseLabel.chunk_id == ContractChunk.id)
            .filter(ContractChunk.contract_id == contract_id)
            .all()
        )

        for chunk, label in chunks_with_labels:
            risk_result = self._analyze_clause_risk(chunk.chunk_text, label.clause_type)
            if risk_result:
                risks.append({
                    "risk_type": risk_result["risk_type"],
                    "severity": risk_result["severity"],
                    "description": risk_result["description"],
                    "related_chunk_id": chunk.id,
                })

        # --- Persist to DB ---
        for risk in risks:
            risk_row = ContractRisk(
                contract_id=contract_id,
                risk_type=risk["risk_type"],
                severity=risk["severity"],
                description=risk["description"],
                related_chunk_id=risk["related_chunk_id"],
            )
            db.add(risk_row)
        db.commit()

        return risks

    def _analyze_clause_risk(self, clause_text: str, clause_type: str) -> dict | None:
        prompt = f"""You are a contract risk analyst. Analyze the following {clause_type} clause for potential risks to the party relying on this analysis.

Note: this clause excerpt may begin or end mid-sentence, since it was extracted from a longer document. Do not treat incomplete sentence fragments at the start/end as ambiguous or undefined terms - focus only on the substantive legal content.

Look specifically for patterns like: unlimited liability, one-sided termination rights, automatic renewal without adequate notice, unusually long notice periods, vague or undefined terms.

Clause text:
{clause_text}

If you identify a genuine risk, respond in EXACTLY this format:
RISK: <short risk name>
SEVERITY: <low|medium|high>
DESCRIPTION: <one sentence explaining the risk, referencing the specific clause language>

If there is no significant risk in this clause, respond with exactly:
NO_RISK
"""
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            text = response.text.strip()
        except Exception:
            return None

        if text.startswith("NO_RISK") or "RISK:" not in text:
            return None

        try:
            lines = text.split("\n")
            risk_type = next(l.split("RISK:", 1)[1].strip() for l in lines if l.startswith("RISK:"))
            severity = next(l.split("SEVERITY:", 1)[1].strip().lower() for l in lines if l.startswith("SEVERITY:"))
            description = next(l.split("DESCRIPTION:", 1)[1].strip() for l in lines if l.startswith("DESCRIPTION:"))
            return {"risk_type": risk_type, "severity": severity, "description": description}
        except (StopIteration, IndexError):
            return None


risk_detection_service = RiskDetectionService()