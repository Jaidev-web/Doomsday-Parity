from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class InterviewEvent(BaseModel):
    event_type: str  # tab_switch, copy_paste, focus_loss, idle_timeout, window_resize
    timestamp: datetime
    details: Optional[Dict] = None


class InterviewSession(BaseModel):
    id: str
    candidate_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str = "active"  # active, completed, flagged
    events: List[InterviewEvent] = []
    total_questions: int = 0
    answered_questions: int = 0


class InterviewReport(BaseModel):
    session_id: str
    candidate_id: str
    tab_switches: int = 0
    copy_paste_count: int = 0
    focus_losses: int = 0
    idle_timeouts: int = 0
    suspicious_patterns: List[str] = []
    integrity_score: float = 100.0
    recommendation: str = "clean"  # clean, review, flagged
    generated_at: datetime
