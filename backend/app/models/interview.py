from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class InterviewEvent(BaseModel):
    event_type: str  # tab_switch, copy_paste, focus_loss, idle_timeout, window_resize
    timestamp: datetime
    details: Optional[Dict] = None


class InterviewGazeUpdate(BaseModel):
    is_looking_at_screen: bool
    face_detected: bool
    timestamp: datetime
    attention_score: float = Field(ge=0, le=100)


class InterviewAnswerSubmission(BaseModel):
    question_id: str
    question: str = Field(min_length=1, max_length=2000)
    category: str = Field(default="general", max_length=100)
    transcript: str = Field(min_length=5, max_length=20000)


class InterviewResponseAnalysisRequest(BaseModel):
    question_id: str
    question: str = Field(default="General interview question", max_length=2000)
    transcript: str = Field(min_length=5, max_length=20000)


class InterviewQuestionDispatch(BaseModel):
    question_id: str = Field(min_length=1, max_length=100)
    question: str = Field(min_length=1, max_length=2000)
    category: str = Field(default="custom", max_length=100)


class InterviewQuestionGenerationRequest(BaseModel):
    skill: Optional[str] = Field(default=None, max_length=300)
    project: Optional[str] = Field(default=None, max_length=1000)
    context: Optional[str] = Field(default=None, max_length=2000)


class InterviewQuestionQueueUpdate(BaseModel):
    questions: List[InterviewQuestionDispatch] = Field(max_length=100)


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
