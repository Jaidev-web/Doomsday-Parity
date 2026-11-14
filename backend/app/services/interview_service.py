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

        is_looking = bool(update["is_looking_at_screen"])
        face_detected = bool(update["face_detected"])
        gaze_status = "high" if is_looking else "low"
        previous_status = session.get("gaze_status")
        previous_away_state = session.get("gaze_away_active")
        if previous_away_state is None:
            previous_away_state = (
                session.get("gaze_status") == "low"
                and session.get("gaze_face_detected") is True
            )
        gaze_away_active = bool(previous_away_state)
        lookaway_started = face_detected and not is_looking and not gaze_away_active
        changes = {
            "gaze_status": gaze_status,
            "gaze_attention_score": update["attention_score"],
            "gaze_face_detected": face_detected,
            "gaze_updated_at": update["timestamp"],
            # A missing face is a camera/visibility issue, not an eye look-away.
            # Reset the active interval so the next detected off-screen gaze is
            # counted as a new look-away.
            "gaze_away_active": face_detected and not is_looking,
        }
        events = session.get("events", [])
        if lookaway_started:
            events.append({
                "event_type": "gaze_lookaway",
                "timestamp": update["timestamp"].isoformat() if hasattr(update["timestamp"], "isoformat") else update["timestamp"],
                "details": {
                    "face_detected": True,
                    "attention_score": update["attention_score"],
                },
            })
        if previous_status != gaze_status:
            events.append({
                "event_type": "gaze_status",
                "timestamp": update["timestamp"].isoformat() if hasattr(update["timestamp"], "isoformat") else update["timestamp"],
                "details": {
                    "status": gaze_status,
                    "is_looking_at_screen": is_looking,
                    "face_detected": face_detected,
                    "lookaway_counted": lookaway_started,
                    "attention_score": update["attention_score"],
                },
            })
        if lookaway_started or previous_status != gaze_status:
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
        explicit_lookaway_events = [
            e for e in events if e.get("event_type") in {"gaze_lookaway", "gaze_away"}
        ]
        explicit_lookaway_timestamps = {str(e.get("timestamp")) for e in explicit_lookaway_events}
        # Count older gaze_status transitions too, while avoiding double counts
        # for sessions that already have the explicit transition event.
        legacy_lookaways = [
            e for e in events
            if e.get("event_type") == "gaze_status"
            and (e.get("details") or {}).get("status") == "low"
            and (e.get("details") or {}).get("face_detected") is True
            and str(e.get("timestamp")) not in explicit_lookaway_timestamps
        ]
        gaze_lookaways = len(explicit_lookaway_events) + len(legacy_lookaways)

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
            "gaze_lookaways": gaze_lookaways,
            "copy_paste_count": copy_pastes,
            "focus_losses": focus_losses,
            "idle_timeouts": idle_timeouts,
            "typing_events": len(typing_events),
            "typing_keystrokes": typing_keystrokes,
            "typing_bursts": len(typing_events),
            "suspicious_patterns": patterns,
        }

    def generate_integrity_report(self, session_id: str) -> Dict:
        """Generate a full integrity report for an interview session."""
        session = db.get("interviews", session_id)
        if not session:
            return {"error": "Session not found"}

        patterns = self.aggregate_suspicious_patterns(session_id)

        # Browser behavior and answer style are scored separately so the HR
        # monitor can explain what contributes to the total. The answer score
        # is only used when the transcript analysis is conclusive.
        browser_score = max(0.0, 100.0
            - patterns["gaze_lookaways"] * 3
            - patterns["tab_switches"] * 5
            - patterns["typing_bursts"] * 2
            - patterns["copy_paste_count"] * 8
            - patterns["focus_losses"] * 3
            - patterns["idle_timeouts"] * 2)
        conclusive_answers = [
            answer for answer in session.get("answers", [])
            if answer.get("analysis_status") == "complete"
            and isinstance(answer.get("ai_score"), (int, float))
            and answer.get("verdict") != "inconclusive"
            and answer.get("confidence") != "low"
        ]
        answer_integrity_score = (
            sum(100.0 - max(0.0, min(100.0, float(answer["ai_score"]))) for answer in conclusive_answers)
            / len(conclusive_answers)
            if conclusive_answers else None
        )
        score = (
            round(browser_score * 0.75 + answer_integrity_score * 0.25)
            if answer_integrity_score is not None
            else round(browser_score)
        )

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
            "gaze_lookaways": patterns["gaze_lookaways"],
            "copy_paste_count": patterns["copy_paste_count"],
            "focus_losses": patterns["focus_losses"],
            "idle_timeouts": patterns["idle_timeouts"],
            "typing_events": patterns["typing_events"],
            "typing_bursts": patterns["typing_bursts"],
            "typing_keystrokes": patterns["typing_keystrokes"],
            "browser_integrity_score": round(browser_score, 2),
            "answer_integrity_score": round(answer_integrity_score, 2) if answer_integrity_score is not None else None,
            "answers_analyzed": len(conclusive_answers),
            "answers_submitted": len(session.get("answers", [])),
            "answers_pending": sum(1 for answer in session.get("answers", []) if answer.get("analysis_status") == "pending"),
            "answers_unavailable": sum(1 for answer in session.get("answers", []) if answer.get("analysis_status") == "unavailable"),
            "ai_flagged_answers": sum(1 for answer in conclusive_answers if answer.get("flagged_for_review")),
            "answer_integrity_weight_percent": 25 if answer_integrity_score is not None else 0,
            "scoring_note": "Browser signals are scored on a 0–100 scale. When conclusive answer analysis is available, total integrity is 75% browser score and 25% inverse AI-style score. AI-style analysis is a review signal, not proof of authorship.",
            "suspicious_patterns": patterns["suspicious_patterns"],
            "integrity_score": score,
            "recommendation": recommendation,
            "generated_at": datetime.utcnow().isoformat(),
        }


interview_service = InterviewService()
