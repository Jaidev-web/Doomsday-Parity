from typing import Dict, List
from datetime import datetime
import uuid
from app.db import db
from app.services.ai_service import ai_service


class InterviewService:
    async def analyze_response(self, question: str, transcript: str) -> Dict:
        return await ai_service.analyze_interview_answer(question, transcript)

    async def generate_question(self, request: Dict) -> Dict:
        return await ai_service.generate_interview_question(
            request.get("skill"), request.get("project"), request.get("context")
        )

    async def submit_answer(self, session_id: str, submission: Dict) -> Dict:
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}
        if session.get("status") != "active":
            return {"error": "Interview session is not active"}

        answer = {
            "id": str(uuid.uuid4()),
            "question_id": submission["question_id"],
            "question": submission["question"],
            "category": submission.get("category", "general"),
            "transcript": submission["transcript"],
            "submitted_at": datetime.utcnow().isoformat(),
            "analysis_status": "pending",
        }
        answers = session.get("answers", [])
        answers.append(answer)
        changes = {
            "answers": answers,
            "answered_questions": len(answers),
        }
        db.update("interviews", session_id, changes)
        return answer

    async def analyze_saved_answer(self, session_id: str, answer_id: str, question: str, transcript: str) -> None:
        """Run Gemma after saving the transcript so review latency cannot hide an answer."""
        try:
            analysis = await self.analyze_response(question, transcript)
            analysis["analysis_status"] = "complete"
        except Exception as error:
            analysis = {
                "analysis_status": "unavailable",
                "ai_score": None,
                "verdict": "inconclusive",
                "flagged_for_review": False,
                "confidence": "low",
                "analysis_source": "unavailable",
                "signals": {},
                "reasons": [],
                "model_error": str(error),
                "note": "The transcript was saved, but AI style analysis could not be completed.",
            }

        session = db.get("interviews", session_id)
        if not session:
            return
        answers = session.get("answers", [])
        updated_answer = None
        for index, answer in enumerate(answers):
            if answer.get("id") == answer_id:
                updated_answer = {**answer, **analysis}
                answers[index] = updated_answer
                break
        if not updated_answer:
            return

        changes = {"answers": answers}
        if analysis.get("flagged_for_review"):
            events = session.get("events", [])
            events.append({
                "event_type": "ai_response_suspected",
                "timestamp": updated_answer["submitted_at"],
                "details": {
                    "answer_id": answer_id,
                    "question_id": updated_answer["question_id"],
                    "pattern_score": analysis["ai_score"],
                    "confidence": analysis["confidence"],
                },
            })
            changes["events"] = events
        db.update("interviews", session_id, changes)

    def update_gaze_status(self, session_id: str, update: Dict) -> Dict:
        """Persist the latest candidate-side gaze assessment for HR monitoring."""
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}

        gaze_status = "high" if update["is_looking_at_screen"] else "low"
        previous_status = session.get("gaze_status")
        changes = {
            "gaze_status": gaze_status,
            "gaze_attention_score": update["attention_score"],
            "gaze_face_detected": update["face_detected"],
            "gaze_updated_at": update["timestamp"],
        }
        if previous_status != gaze_status:
            events = session.get("events", [])
            events.append({
                "event_type": "gaze_status",
                "timestamp": update["timestamp"],
                "details": {
                    "status": gaze_status,
                    "is_looking_at_screen": update["is_looking_at_screen"],
                    "face_detected": update["face_detected"],
                    "attention_score": update["attention_score"],
                },
            })
            changes["events"] = events

        updated = db.update("interviews", session_id, changes)
        return {
            "session_id": session_id,
            "gaze_status": updated["gaze_status"],
            "attention_score": updated["gaze_attention_score"],
            "face_detected": updated["gaze_face_detected"],
            "updated_at": updated["gaze_updated_at"],
        }

    def process_event(self, session_id: str, event: Dict) -> Dict:
        """Process a single browser event from the interview session."""
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}

        events = session.get("events", [])
        events.append(event)
        db.update("interviews", session_id, {"events": events})
        return {"status": "recorded", "total_events": len(events)}

    def aggregate_suspicious_patterns(self, session_id: str) -> Dict:
        """Aggregate events into suspicious pattern counts."""
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}

        events = session.get("events", [])
        tab_switches = sum(1 for e in events if e.get("event_type") == "tab_switch")
        copy_pastes = sum(1 for e in events if e.get("event_type") in {"copy_paste", "large_paste"})
        focus_losses = sum(1 for e in events if e.get("event_type") in {"focus_loss", "window_blur"})
        typing_events = [e for e in events if e.get("event_type") == "typing_detected"]
        typing_keystrokes = sum((e.get("details") or {}).get("key_count", 0) for e in typing_events)
        idle_timeouts = sum(1 for e in events if e.get("event_type") == "idle_timeout")

        patterns = []
        if tab_switches >= 5:
            patterns.append(f"High tab switching: {tab_switches} switches detected")
        elif tab_switches >= 3:
            patterns.append(f"Moderate tab switching: {tab_switches} switches detected")

        if copy_pastes >= 3:
            patterns.append(f"Frequent copy-paste: {copy_pastes} events detected")

        if focus_losses >= 3:
            patterns.append(f"Multiple focus losses: {focus_losses} detected")

        # Correlated tab-switch + copy-paste
        for i in range(len(events) - 1):
            if (events[i].get("event_type") == "tab_switch"
                    and events[i + 1].get("event_type") == "copy_paste"):
                patterns.append("Copy-paste event immediately after tab switch")

        return {
            "tab_switches": tab_switches,
            "copy_paste_count": copy_pastes,
            "focus_losses": focus_losses,
            "idle_timeouts": idle_timeouts,
            "typing_events": len(typing_events),
            "typing_keystrokes": typing_keystrokes,
            "suspicious_patterns": patterns,
        }

    def generate_integrity_report(self, session_id: str) -> Dict:
        """Generate a full integrity report for an interview session."""
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}

        patterns = self.aggregate_suspicious_patterns(session_id)

        # Calculate integrity score
        score = 100.0
        score -= patterns["tab_switches"] * 5
        score -= patterns["copy_paste_count"] * 8
        score -= patterns["focus_losses"] * 3
        score -= patterns["idle_timeouts"] * 2
        score = max(0.0, score)

        if score >= 80:
            recommendation = "clean"
        elif score >= 50:
            recommendation = "review"
        else:
            recommendation = "flagged"

        return {
            "session_id": session_id,
            "candidate_id": session.get("candidate_id"),
            "tab_switches": patterns["tab_switches"],
            "copy_paste_count": patterns["copy_paste_count"],
            "focus_losses": patterns["focus_losses"],
            "idle_timeouts": patterns["idle_timeouts"],
            "typing_events": patterns["typing_events"],
            "typing_keystrokes": patterns["typing_keystrokes"],
            "suspicious_patterns": patterns["suspicious_patterns"],
            "integrity_score": score,
            "recommendation": recommendation,
            "generated_at": datetime.utcnow().isoformat(),
        }


interview_service = InterviewService()
