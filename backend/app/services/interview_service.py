from typing import Dict, List
from datetime import datetime
from app.db import db


class InterviewService:
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
        copy_pastes = sum(1 for e in events if e.get("event_type") == "copy_paste")
        focus_losses = sum(1 for e in events if e.get("event_type") == "focus_loss")
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
            "suspicious_patterns": patterns["suspicious_patterns"],
            "integrity_score": score,
            "recommendation": recommendation,
            "generated_at": datetime.utcnow().isoformat(),
        }


interview_service = InterviewService()
