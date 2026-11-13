from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AIQuestion(BaseModel):
    question: str
    context: Optional[str] = None


class AIResponse(BaseModel):
    id: str
    candidate_id: str
    question: str
    answer: str
    model_used: str = "demo"
    timestamp: datetime


class AIHistory(BaseModel):
    candidate_id: str
    conversations: List[AIResponse] = []
