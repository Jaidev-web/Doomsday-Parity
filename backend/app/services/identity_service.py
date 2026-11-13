from typing import Dict, List
from datetime import datetime
import uuid
from app.db import db


class IdentityService:
    def extract_document_info(self, file_bytes: bytes, doc_type: str) -> Dict:
        """Extract information from identity documents (stub)."""
        return {
            "doc_type": doc_type,
            "status": "stub",
            "message": "Document OCR/extraction requires additional integration.",
            "extracted_name": None,
            "extracted_dates": None,
        }

    def check_name_consistency(self, names: List[str]) -> Dict:
        """Check if names from different sources are consistent."""
        if not names:
            return {"status": "no_data", "consistent": False}

        normalized = [n.strip().lower() for n in names]
        base = normalized[0]
        mismatches = [orig for orig, norm in zip(names, normalized) if norm != base]

        return {
            "status": "passed" if not mismatches else "warning",
            "consistent": len(mismatches) == 0,
            "base_name": names[0],
            "mismatches": mismatches,
        }

    def check_date_consistency(self, dates: Dict[str, str]) -> Dict:
        """Check dates across documents for consistency (stub)."""
        return {
            "status": "stub",
            "dates_provided": dates,
            "message": "Date cross-referencing requires document parsing integration.",
        }

    def verify_pan(self, pan_number: str) -> Dict:
        """Simulated PAN verification."""
        if not pan_number or len(pan_number) != 10:
            return {"status": "invalid", "message": "Invalid PAN format"}
        return {
            "status": "verified",
            "pan": pan_number[:4] + "****" + pan_number[-2:],
            "message": "[Simulated] PAN verification passed.",
        }

    def check_cross_platform_consistency(self, candidate_id: str) -> Dict:
        """Check consistency of candidate info across platforms (stub)."""
        candidate = db.get("candidates", candidate_id)
        if not candidate:
            return {"status": "error", "message": "Candidate not found"}
        return {
            "status": "stub",
            "platforms_checked": ["resume", "linkedin", "github"],
            "message": "Cross-platform consistency check requires API integrations.",
        }

    def run_full_identity_check(self, candidate_id: str) -> List[Dict]:
        """Run all identity checks for a candidate."""
        results = db.list("verifications", {"candidate_id": candidate_id, "module": "identity"})
        if results:
            return results

        now = datetime.utcnow()
        result = {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "module": "identity",
            "check_type": "full_check",
            "status": "pending",
            "severity": "low",
            "title": "Identity verification initiated",
            "explanation": "Full identity check has been queued. Upload ID documents to begin analysis.",
            "evidence": [],
            "timestamp": now.isoformat(),
        }
        db.add("verifications", result)
        return [result]


identity_service = IdentityService()
