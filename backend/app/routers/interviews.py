from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
import uuid

from app.models.interview import InterviewEvent
from app.db import db
from app.services.interview_service import interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("/", status_code=201)
async def create_interview(candidate_id: str, total_questions: int = 5):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    session = {
        "id": str(uuid.uuid4()),
        "candidate_id": candidate_id,
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "status": "active",
        "events": [],
        "total_questions": total_questions,
        "answered_questions": 0,
    }
    db.add("interviews", session)
    return session


@router.get("/{session_id}")
async def get_interview(session_id: str):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/{session_id}/events")
async def record_event(session_id: str, event: InterviewEvent):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    result = interview_service.process_event(session_id, event.model_dump(mode="json"))
    return result


@router.post("/{session_id}/analyze")
async def analyze_interview(session_id: str):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    patterns = interview_service.aggregate_suspicious_patterns(session_id)
    return patterns


@router.get("/{session_id}/report")
async def get_report(session_id: str):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    report = interview_service.generate_integrity_report(session_id)
    return report
