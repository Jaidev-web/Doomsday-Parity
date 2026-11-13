from typing import Dict, Optional
from app.db import db


class TrustService:
    """
    Rule-based trust scoring.
    Weights: credential 40%, identity 35%, interview 25%.
    Thresholds: >=75 high trust, 50-74 needs review, <50 critical.
    """

    CREDENTIAL_WEIGHT = 0.40
    IDENTITY_WEIGHT = 0.35
    INTERVIEW_WEIGHT = 0.25

    def _score_module(self, verifications: list, module: str) -> float:
        """Score a single module's verifications on a 0-100 scale."""
        items = [v for v in verifications if v.get("module") == module]
        if not items:
            return 50.0  # Neutral if no data

        score = 100.0
        for v in items:
            status = v.get("status", "pending")
            severity = v.get("severity", "low")

            severity_mult = {"low": 1.0, "medium": 2.0, "high": 3.0, "critical": 4.0}.get(severity, 1.0)

            if status == "failed":
                score -= 15 * severity_mult
            elif status == "warning":
                score -= 8 * severity_mult
            elif status == "pending":
                score -= 3

        return max(0.0, min(100.0, score))

    def calculate_trust_score(self, candidate_id: str) -> Dict:
        """Calculate the overall trust score for a candidate."""
        verifications = db.list("verifications", {"candidate_id": candidate_id})

        credential_score = self._score_module(verifications, "credential")
        identity_score = self._score_module(verifications, "identity")
        interview_score = self._score_module(verifications, "interview")

        overall = (
            credential_score * self.CREDENTIAL_WEIGHT
            + identity_score * self.IDENTITY_WEIGHT
            + interview_score * self.INTERVIEW_WEIGHT
        )

        if overall >= 75:
            status = "verified"
        elif overall >= 50:
            status = "needs_review"
        else:
            status = "critical_review"

        # Determine per-module status
        def module_status(score: float) -> str:
            if score >= 75:
                return "verified"
            elif score >= 50:
                return "warning"
            else:
                return "failed"

        result = {
            "candidate_id": candidate_id,
            "trust_score": round(overall, 1),
            "overall_status": status,
            "credential_score": round(credential_score, 1),
            "credential_status": module_status(credential_score),
            "identity_score": round(identity_score, 1),
            "identity_status": module_status(identity_score),
            "interview_score": round(interview_score, 1),
            "interview_status": module_status(interview_score),
            "total_checks": len(verifications),
            "breakdown": {
                "credential_weight": self.CREDENTIAL_WEIGHT,
                "identity_weight": self.IDENTITY_WEIGHT,
                "interview_weight": self.INTERVIEW_WEIGHT,
            },
        }

        # Update candidate record
        db.update("candidates", candidate_id, {
            "trust_score": result["trust_score"],
            "overall_status": result["overall_status"],
            "credential_status": result["credential_status"],
            "identity_status": result["identity_status"],
            "interview_status": result["interview_status"],
        })

        return result

    def get_trust_breakdown(self, candidate_id: str) -> Optional[Dict]:
        """Get the trust breakdown for a candidate (recalculate if needed)."""
        candidate = db.get("candidates", candidate_id)
        if not candidate:
            return None
        return self.calculate_trust_score(candidate_id)


trust_service = TrustService()
