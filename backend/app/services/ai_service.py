from typing import Optional, Dict
from datetime import datetime
import uuid
import json
import re
import statistics
import httpx
from app.config import settings


class AIService:
    def __init__(self):
        self.model = settings.GEMMA_MODEL
        self.demo_mode = settings.DEMO_MODE if settings.AI_DEMO_MODE is None else settings.AI_DEMO_MODE

    async def _call_gemma(self, prompt: str, strict: bool = False, json_mode: bool = False) -> str:
        """Call Gemma; local Ollama does not require an API key."""
        if self.demo_mode:
            return self._mock_response(prompt)

        base_url = settings.GEMMA_API_BASE_URL.rstrip("/")
        host = httpx.URL(base_url).host.lower()
        is_local = host in {"localhost", "127.0.0.1", "::1"}
        if not settings.GEMMA_API_KEY and not is_local:
            error = RuntimeError("GEMMA_API_KEY is required for a remote Gemma endpoint")
            if strict:
                raise error
            return self._mock_response(prompt)

        try:
            payload = {"model": self.model, "prompt": prompt, "stream": False}
            if json_mode:
                payload["format"] = "json"
            headers = {"Authorization": f"Bearer {settings.GEMMA_API_KEY}"} if settings.GEMMA_API_KEY else {}
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/generate",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                return response.json().get("response", "No response generated.")
        except Exception as error:
            if strict:
                raise RuntimeError(f"Gemma request failed: {error}") from error
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

    async def generate_interview_question(self, skill: Optional[str], project: Optional[str], context: Optional[str]) -> Dict:
        focus = skill or project or context or "the candidate's role and experience"
        if self.demo_mode:
            # Keep the question workflow usable with the seeded, in-memory demo
            # backend. Make the fallback explicit so the UI never implies that
            # a local language model produced it.
            focus_label = str(skill or project or "your resume and experience").strip().rstrip(".")
            return {
                "question_id": str(uuid.uuid4()),
                "question_text": (
                    f"Describe a specific example of your experience with {focus_label}. "
                    "What was your role, what decisions did you make, and what was the outcome?"
                ),
                "category": "technical" if skill else "resume",
                "difficulty": "medium",
                "generation_source": "demo_template",
            }
        prompt = (
            "Create one clear, open-ended interview question that helps verify the candidate's own experience. "
            "Keep it concise, neutral, answerable aloud, and do not assume facts. Return only JSON with keys "
            "question_text, category, and difficulty.\n"
            f"Focus: {focus}\nAdditional context: {context or 'none'}"
        )
        raw = await self._call_gemma(prompt, strict=True, json_mode=True)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        result = json.loads(match.group(0) if match else raw)
        question = str(result.get("question_text", "")).strip()
        if not question:
            raise RuntimeError("Gemma returned an empty interview question")
        return {
            "question_id": str(uuid.uuid4()),
            "question_text": question,
            "category": str(result.get("category") or ("technical" if skill else "resume")),
            "difficulty": str(result.get("difficulty") or "medium"),
        }

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

    def _answer_style_signals(self, transcript: str) -> Dict:
        words = re.findall(r"\b[\w'-]+\b", transcript.lower())
        sentences = [part.strip() for part in re.split(r"[.!?]+", transcript) if part.strip()]
        sentence_lengths = [len(re.findall(r"\b[\w'-]+\b", sentence)) for sentence in sentences]
        word_count = len(words)
        average_word_length = sum(map(len, words)) / word_count if word_count else 0
        mean_sentence_length = statistics.mean(sentence_lengths) if sentence_lengths else 0
        sentence_cv = (
            statistics.pstdev(sentence_lengths) / mean_sentence_length
            if len(sentence_lengths) > 1 and mean_sentence_length
            else None
        )
        fillers = re.findall(r"\b(?:um+|uh+|erm?|you know|i mean|sort of|kind of)\b", transcript.lower())
        first_person = bool(re.search(r"\b(i|we|my|our)\b", transcript.lower()))
        concrete_detail = bool(re.search(r"\b\d+(?:\.\d+)?\b|\b(?:project|customer|incident|launch|migration|deadline)\b", transcript.lower()))
        unique_ratio = len(set(words)) / word_count if word_count else 0

        score = 15
        if sentence_cv is not None:
            if sentence_cv < 0.25:
                score += 25
            elif sentence_cv < 0.4:
                score += 12
            elif sentence_cv > 0.75:
                score -= 8
        if word_count >= 40 and not fillers:
            score += 10
        elif word_count and len(fillers) / word_count >= 0.06:
            score -= 15
        elif fillers:
            score -= 8
        if average_word_length >= 5.8:
            score += 18
        elif average_word_length >= 5.2:
            score += 10
        if word_count >= 60 and unique_ratio > 0.78:
            score += 8
        if first_person and concrete_detail:
            score -= 15
        score = max(0, min(100, score))

        uniformity = (
            f"Low sentence-length variation (CV {sentence_cv:.2f})"
            if sentence_cv is not None and sentence_cv < 0.4
            else "Sentence lengths vary"
        )
        vocabulary = f"Average word length {average_word_length:.1f} characters"
        filler_signal = f"{len(fillers)} filler phrases detected" if fillers else "No common filler phrases detected"
        personal_context = "First-person language and concrete details present" if first_person and concrete_detail else "Few first-person concrete details found"

        reasons = []
        if sentence_cv is not None and sentence_cv < 0.4:
            reasons.append("Sentence lengths are relatively uniform.")
        if word_count >= 40 and not fillers:
            reasons.append("No common spoken filler phrases appeared in the transcript.")
        if average_word_length >= 5.2:
            reasons.append("The transcript uses longer-than-average words.")
        if first_person and concrete_detail:
            reasons.append("The answer includes first-person language and concrete details, which lowers the pattern score.")
        if not reasons:
            reasons.append("The transcript did not show strong signals in the limited text checks used.")

        return {
            "heuristic_score": score,
            "word_count": word_count,
            "signals": {
                "vocabulary": vocabulary,
                "fillers": filler_signal,
                "uniformity": uniformity,
                "personal_context": personal_context,
                "pause_patterns": "Not assessed from transcript text",
            },
            "reasons": reasons,
            "sentence_length_cv": sentence_cv,
        }

    async def analyze_interview_answer(self, question: str, transcript: str) -> Dict:
        """Estimate AI-like writing patterns; this is not an authorship proof."""
        style = self._answer_style_signals(transcript)
        score = style["heuristic_score"]
        source = "linguistic_heuristic"

        model_error = None
        if not self.demo_mode:
            prompt = (
                "Review this interview transcript for stylistic patterns sometimes associated with generated text. "
                "This cannot prove authorship. Do not infer based on grammar, fluency, identity, accent, or language background. "
                "Return only JSON with integer score from 0 to 100 and a short reasons array. "
                "Treat 0 as few AI-like style signals and 100 as many.\n"
                f"Question: {question}\nTranscript: {transcript}"
            )
            try:
                raw = await self._call_gemma(prompt, strict=True, json_mode=True)
            except RuntimeError as error:
                raw = ""
                model_error = str(error)
            if raw and not raw.startswith("[Demo Mode]"):
                try:
                    match = re.search(r"\{.*\}", raw, re.DOTALL)
                    model_result = json.loads(match.group(0) if match else raw)
                    model_score = max(0, min(100, int(model_result["score"])))
                    score = round((style["heuristic_score"] + model_score) / 2)
                    model_reasons = model_result.get("reasons", [])
                    if isinstance(model_reasons, list):
                        style["reasons"] = [str(reason) for reason in model_reasons[:4]] or style["reasons"]
                    source = f"{self.model}+linguistic_heuristic"
                except (ValueError, TypeError, KeyError, json.JSONDecodeError):
                    source = "linguistic_heuristic_fallback"
            elif model_error:
                source = "linguistic_heuristic_fallback"

        word_count = style["word_count"]
        too_short = word_count < 40
        flagged = not too_short and score >= 70
        verdict = "review_required" if flagged else "inconclusive" if too_short or score >= 40 else "no_strong_signals"
        return {
            "ai_score": score,
            "verdict": verdict,
            "flagged_for_review": flagged,
            "confidence": "low" if too_short else "medium",
            "analysis_source": source,
            "signals": style["signals"],
            "reasons": style["reasons"],
            "note": "A transcript-only style score is an imperfect review signal, not proof that AI was used.",
            "model_error": model_error,
        }


ai_service = AIService()
