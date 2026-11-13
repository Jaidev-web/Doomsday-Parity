from typing import Dict, List, Optional
from datetime import datetime
import uuid
from app.db import db


class CredentialService:
    def extract_pdf_text(self, file_bytes: bytes) -> str:
        """Extract text from a PDF file."""
        try:
            from PyPDF2 import PdfReader
            import io
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except Exception as e:
            return f"[Error extracting PDF text: {str(e)}]"

    def check_certificate_metadata(self, file_bytes: bytes) -> Dict:
        """Analyze certificate PDF metadata for inconsistencies."""
        try:
            from PyPDF2 import PdfReader
            import io
            reader = PdfReader(io.BytesIO(file_bytes))
            metadata = reader.metadata
            return {
                "author": metadata.get("/Author", "Unknown"),
                "creator": metadata.get("/Creator", "Unknown"),
                "created_date": str(metadata.get("/CreationDate", "Unknown")),
                "modified_date": str(metadata.get("/ModDate", "Unknown")),
                "producer": metadata.get("/Producer", "Unknown"),
            }
        except Exception:
            return {"error": "Could not extract metadata"}

    def cross_reference_employment(
        self, resume_dates: List[Dict], linkedin_dates: List[Dict]
    ) -> List[Dict]:
        """Cross-reference employment dates between sources (stub)."""
        results = []
        for entry in resume_dates:
            match = next(
                (l for l in linkedin_dates if l.get("company", "").lower() == entry.get("company", "").lower()),
                None,
            )
            if match:
                if entry.get("start") != match.get("start") or entry.get("end") != match.get("end"):
                    results.append({
                        "company": entry["company"],
                        "status": "mismatch",
                        "resume": entry,
                        "linkedin": match,
                    })
                else:
                    results.append({"company": entry["company"], "status": "match"})
            else:
                results.append({"company": entry.get("company"), "status": "not_found_on_linkedin"})
        return results

    def analyze_github_profile(self, github_url: str) -> Dict:
        """Stub: analyze GitHub profile for consistency with claims."""
        return {
            "url": github_url,
            "status": "stub",
            "message": "GitHub analysis requires API integration. Using demo data.",
            "account_age": None,
            "total_repos": None,
            "total_commits": None,
        }

    def run_full_credential_check(self, candidate_id: str) -> List[Dict]:
        """Run all credential checks for a candidate and store results."""
        results = db.list("verifications", {"candidate_id": candidate_id, "module": "credential"})
        if results:
            return results

        now = datetime.utcnow()
        result = {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "module": "credential",
            "check_type": "full_check",
            "status": "pending",
            "severity": "low",
            "title": "Credential verification initiated",
            "explanation": "Full credential check has been queued. Upload documents to begin analysis.",
            "evidence": [],
            "timestamp": now.isoformat(),
        }
        db.add("verifications", result)
        return [result]


credential_service = CredentialService()
