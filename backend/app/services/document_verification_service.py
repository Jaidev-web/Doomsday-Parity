"""
Document Verification Service — Gemma-powered AI analysis.

Triggered after each document upload. Calls Gemma (via Ollama) to:
  - resume       → extract skills, check employment consistency, flag red-flags
  - certificate  → verify issuer legitimacy, date validity, name match
  - id_document  → check name match, document completeness

Results are stored as verification records and the trust score is recalculated.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any

from app.db import db
from app.services.ai_service import ai_service


class DocumentVerificationService:

    # ------------------------------------------------------------------ #
    #  Public entry-point                                                  #
    # ------------------------------------------------------------------ #

    async def verify_document(self, doc: Dict[str, Any], candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Run AI verification for one uploaded document.
        Returns a list of verification-record dicts ready to store.
        """
        doc_type = doc.get("document_type", "")
        extracted_text = doc.get("extracted_text", "")
        candidate_name = candidate.get("name", "Unknown")
        position = candidate.get("position", "Unknown")

        if doc_type == "resume":
            results = await self._verify_resume(doc, candidate, extracted_text, candidate_name, position)
        elif doc_type == "certificate":
            results = await self._verify_certificate(doc, candidate, extracted_text, candidate_name)
        elif doc_type == "id_document":
            results = await self._verify_id_document(doc, candidate, extracted_text, candidate_name)
        else:
            results = [self._make_verification(
                candidate_id=candidate["id"],
                doc_id=doc["id"],
                module="credential",
                check_type="document_analysis",
                status="warning",
                severity="low",
                title=f"Unknown document type: {doc_type}",
                explanation="The uploaded document type was not recognised. Manual review required.",
                evidence=[],
            )]

        return results

    # ------------------------------------------------------------------ #
    #  Resume verification                                                 #
    # ------------------------------------------------------------------ #

    async def _verify_resume(self, doc, candidate, text, name, position) -> List[Dict]:
        candidate_id = candidate["id"]
        doc_id = doc["id"]
        results = []

        prompt = (
            f"You are a professional background-verification analyst.\n"
            f"Analyse this resume for a '{position}' position (applicant: {name}).\n\n"
            f"Extract and assess:\n"
            f"1. All claimed employment periods (company, start, end)\n"
            f"2. Skills and technologies mentioned\n"
            f"3. Any red flags: gaps, overlaps, vague dates, inconsistencies\n"
            f"4. Overall trustworthiness assessment\n\n"
            f"Return ONLY valid JSON in this exact shape:\n"
            f'{{"employment": [{{"company": "...", "start": "...", "end": "..."}}], '
            f'"skills": ["..."], '
            f'"red_flags": [{{"type": "...", "detail": "...", "severity": "low|medium|high|critical"}}], '
            f'"overall_risk": "low|medium|high", '
            f'"summary": "one sentence"}}}}\n\n'
            f"Resume text (first 3000 chars):\n{text[:3000]}"
        )

        raw = await ai_service._call_gemma(prompt, json_mode=True)
        parsed = self._safe_parse_json(raw)

        # Employment analysis result
        red_flags = parsed.get("red_flags") or []
        overall_risk = parsed.get("overall_risk", "low")
        summary = parsed.get("summary", "Resume analysed by Gemma AI.")
        employment = parsed.get("employment", [])
        skills = parsed.get("skills", [])

        status_map = {"low": "passed", "medium": "warning", "high": "failed", "critical": "failed"}
        status = status_map.get(overall_risk, "warning")

        evidence = []
        if employment:
            evidence.append(f"Detected {len(employment)} employment entries")
        if skills:
            evidence.append(f"Skills found: {', '.join(skills[:5])}")
        for rf in red_flags[:3]:
            evidence.append(f"Red flag: {rf.get('detail', '')}")

        results.append(self._make_verification(
            candidate_id=candidate_id,
            doc_id=doc_id,
            module="credential",
            check_type="resume_analysis",
            status=status,
            severity=overall_risk if overall_risk in {"low", "medium", "high", "critical"} else "low",
            title="Gemma AI Resume Analysis",
            explanation=summary,
            evidence=evidence or ["Resume processed by Gemma AI"],
        ))

        # Individual red-flag records
        for i, rf in enumerate(red_flags[:5]):
            sev = rf.get("severity", "medium")
            results.append(self._make_verification(
                candidate_id=candidate_id,
                doc_id=doc_id,
                module="credential",
                check_type=f"resume_flag_{rf.get('type', 'issue')}",
                status="failed" if sev in {"high", "critical"} else "warning",
                severity=sev,
                title=f"Resume Issue: {rf.get('type', 'Flag').replace('_', ' ').title()}",
                explanation=rf.get("detail", "AI flagged a potential issue in the resume."),
                evidence=[],
            ))

        return results

    # ------------------------------------------------------------------ #
    #  Certificate verification                                            #
    # ------------------------------------------------------------------ #

    async def _verify_certificate(self, doc, candidate, text, name) -> List[Dict]:
        candidate_id = candidate["id"]
        doc_id = doc["id"]

        prompt = (
            f"You are a professional credential-verification analyst.\n"
            f"Analyse this certificate document for candidate: {name}.\n\n"
            f"Check:\n"
            f"1. Is the issuing authority a legitimate, known organisation?\n"
            f"2. Are the dates plausible (not future-dated, not obviously forged)?\n"
            f"3. Does the name on the certificate match '{name}'?\n"
            f"4. Any signs of tampering or inconsistency?\n\n"
            f"Return ONLY valid JSON:\n"
            f'{{"valid": true|false, "issuer": "...", "name_match": true|false, '
            f'"date_valid": true|false, "issues": ["..."], "risk": "low|medium|high", '
            f'"summary": "one sentence"}}}}\n\n'
            f"Certificate text (first 2000 chars):\n{text[:2000]}"
        )

        raw = await ai_service._call_gemma(prompt, json_mode=True)
        parsed = self._safe_parse_json(raw)

        valid = parsed.get("valid", True)
        name_match = parsed.get("name_match", True)
        date_valid = parsed.get("date_valid", True)
        issues = parsed.get("issues", [])
        risk = parsed.get("risk", "low")
        summary = parsed.get("summary", "Certificate analysed by Gemma AI.")
        issuer = parsed.get("issuer", "Unknown issuer")

        if not valid or risk in {"high", "critical"}:
            status, severity = "failed", risk or "high"
        elif issues or not name_match or not date_valid:
            status, severity = "warning", "medium"
        else:
            status, severity = "passed", "low"

        evidence = [f"Issuer: {issuer}"]
        if not name_match:
            evidence.append(f"Name on certificate does not match '{name}'")
        if not date_valid:
            evidence.append("Certificate date appears invalid or future-dated")
        for issue in issues[:3]:
            evidence.append(f"Issue: {issue}")

        return [self._make_verification(
            candidate_id=candidate_id,
            doc_id=doc_id,
            module="credential",
            check_type="cert_ai_analysis",
            status=status,
            severity=severity,
            title="Gemma AI Certificate Verification",
            explanation=summary,
            evidence=evidence,
        )]

    # ------------------------------------------------------------------ #
    #  ID document verification                                           #
    # ------------------------------------------------------------------ #

    async def _verify_id_document(self, doc, candidate, text, name) -> List[Dict]:
        candidate_id = candidate["id"]
        doc_id = doc["id"]

        prompt = (
            f"You are an identity-document verification specialist.\n"
            f"Analyse this government-issued ID document for candidate: {name}.\n\n"
            f"Check:\n"
            f"1. Does the name on the document match '{name}'?\n"
            f"2. What type of document is this (passport, national ID, driver's licence)?\n"
            f"3. Is the document complete (no missing fields, not obviously altered)?\n"
            f"4. Any inconsistencies or signs of tampering?\n\n"
            f"Return ONLY valid JSON:\n"
            f'{{"name_match": true|false, "doc_type": "...", "complete": true|false, '
            f'"issues": ["..."], "risk": "low|medium|high", "summary": "one sentence"}}}}\n\n'
            f"ID document text (first 1500 chars):\n{text[:1500]}"
        )

        raw = await ai_service._call_gemma(prompt, json_mode=True)
        parsed = self._safe_parse_json(raw)

        name_match = parsed.get("name_match", True)
        doc_type = parsed.get("doc_type", "identity document")
        complete = parsed.get("complete", True)
        issues = parsed.get("issues", [])
        risk = parsed.get("risk", "low")
        summary = parsed.get("summary", "Identity document analysed by Gemma AI.")

        if not name_match or risk in {"high", "critical"}:
            status, severity = "failed", "high"
        elif issues or not complete:
            status, severity = "warning", "medium"
        else:
            status, severity = "passed", "low"

        evidence = [f"Document type: {doc_type}"]
        if not name_match:
            evidence.append(f"Name does not match candidate name '{name}'")
        if not complete:
            evidence.append("Document appears incomplete or has missing fields")
        for issue in issues[:3]:
            evidence.append(f"Issue: {issue}")

        return [self._make_verification(
            candidate_id=candidate_id,
            doc_id=doc_id,
            module="identity",
            check_type="id_ai_analysis",
            status=status,
            severity=severity,
            title="Gemma AI Identity Document Check",
            explanation=summary,
            evidence=evidence,
        )]

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _make_verification(
        self,
        *,
        candidate_id: str,
        doc_id: str,
        module: str,
        check_type: str,
        status: str,
        severity: str,
        title: str,
        explanation: str,
        evidence: list,
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "document_id": doc_id,
            "module": module,
            "check_type": check_type,
            "status": status,
            "severity": severity,
            "title": title,
            "explanation": explanation,
            "evidence": evidence,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "gemma_ai",
        }

    def _safe_parse_json(self, raw: str) -> Dict:
        """Try to extract and parse a JSON object from Gemma's response."""
        if not raw or raw.startswith("[Demo Mode]"):
            return {}
        try:
            # First attempt: direct parse
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            pass
        try:
            # Second attempt: find {...} block
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass
        return {}


document_verification_service = DocumentVerificationService()
