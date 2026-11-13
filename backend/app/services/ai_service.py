from typing import Optional, Dict
from datetime import datetime
import uuid
import httpx
from app.config import settings


class AIService:
    def __init__(self):
        self.model = settings.GEMMA_MODEL

    async def _call_gemma(self, prompt: str) -> str:
        """Call Gemma API, fall back to mock in demo mode or when no key."""
        if settings.DEMO_MODE or not settings.GEMMA_API_KEY:
            return self._mock_response(prompt)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.GEMMA_API_BASE_URL}/generate",
                    json={"model": self.model, "prompt": prompt, "stream": False},
                    headers={"Authorization": f"Bearer {settings.GEMMA_API_KEY}"},
                )
                response.raise_for_status()
                return response.json().get("response", "No response generated.")
        except Exception:
            return self._mock_response(prompt)

    def _mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "resume" in prompt_lower or "analyze" in prompt_lower:
            return (
                "[Demo Mode] Resume analysis: The candidate's resume shows relevant "
                "experience and skills for the position. Key areas noted include "
                "technical proficiency, project experience, and education credentials. "
                "Recommend cross-referencing employment dates with LinkedIn profile."
            )
        if "compare" in prompt_lower or "discrepancy" in prompt_lower:
            return (
                "[Demo Mode] Document comparison reveals potential inconsistencies "
                "between submitted documents. Key differences found in dates and "
                "role descriptions that warrant further investigation."
            )
        if "interview" in prompt_lower or "question" in prompt_lower:
            return (
                "[Demo Mode] Suggested interview questions:\n"
                "1. Can you walk through a challenging project from your resume?\n"
                "2. How did you apply [specific skill] in your previous role?\n"
                "3. Describe a situation where you had to learn a new technology quickly.\n"
                "4. What was your specific contribution to the team project mentioned?\n"
                "5. Can you explain the architecture decisions you made?"
            )
        if "trust" in prompt_lower or "summary" in prompt_lower:
            return (
                "[Demo Mode] Trust assessment summary: Based on available verification "
                "data, the candidate's profile shows a mix of verified and unverified "
                "claims. Recommend focusing on the flagged areas before proceeding."
            )
        return (
            "[Demo Mode] Analysis complete. The AI assistant has processed your "
            "query. In production mode, this would provide detailed insights "
            "powered by the Gemma language model."
        )

    async def analyze_resume(self, resume_text: str, position: str) -> str:
        prompt = (
            f"Analyze this resume for a {position} position. "
            f"Identify strengths, potential red flags, and areas to verify:\n\n{resume_text}"
        )
        return await self._call_gemma(prompt)

    async def compare_documents(self, doc1_text: str, doc2_text: str) -> str:
        prompt = (
            f"Compare these two documents and identify any discrepancies:\n\n"
            f"Document 1:\n{doc1_text}\n\nDocument 2:\n{doc2_text}"
        )
        return await self._call_gemma(prompt)

    async def generate_interview_questions(self, resume_text: str, position: str) -> str:
        prompt = (
            f"Generate 5 targeted interview questions for a {position} candidate "
            f"based on their resume to verify their claims:\n\n{resume_text}"
        )
        return await self._call_gemma(prompt)

    async def explain_discrepancy(self, discrepancy: str, context: str) -> str:
        prompt = (
            f"Explain this discrepancy found during candidate verification "
            f"and suggest next steps:\n\nDiscrepancy: {discrepancy}\n\nContext: {context}"
        )
        return await self._call_gemma(prompt)

    async def summarize_trust_level(self, candidate_data: dict) -> str:
        prompt = (
            f"Summarize the trust assessment for this candidate:\n\n"
            f"Name: {candidate_data.get('name')}\n"
            f"Trust Score: {candidate_data.get('trust_score')}\n"
            f"Overall Status: {candidate_data.get('overall_status')}\n"
            f"Provide a brief human-readable summary of findings."
        )
        return await self._call_gemma(prompt)


ai_service = AIService()
