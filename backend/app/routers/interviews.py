from fastapi import APIRouter, BackgroundTasks, Body, File, Form, HTTPException, UploadFile
from datetime import datetime
from typing import Dict, Optional
import uuid
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor

from app.models.interview import (
    InterviewAnswerSubmission,
    InterviewEvent,
    InterviewGazeUpdate,
    InterviewQuestionDispatch,
    InterviewQuestionGenerationRequest,
    InterviewQuestionQueueUpdate,
    InterviewResponseAnalysisRequest,
)
from app.db import db
from app.services.interview_service import interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])
_transcription_pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="whisper")
_whisper_model = None


def _transcribe_audio_file(path: str):
    global _whisper_model
    from app.config import settings
    from faster_whisper import WhisperModel

    if _whisper_model is None:
        _whisper_model = WhisperModel(settings.WHISPER_MODEL, device="cpu", compute_type="int8")
    segments, info = _whisper_model.transcribe(path, vad_filter=True)
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return {"transcript_text": text, "language": info.language, "confidence": info.language_probability}


@router.post("/{session_id}/audio")
async def transcribe_interview_audio(
    session_id: str,
    audio: UploadFile = File(...),
    question_id: str = Form(""),
):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="An audio recording is required")

    suffix = ".webm" if "webm" in (audio.content_type or "") else ".audio"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_audio:
            temp_path = temp_audio.name
            while chunk := await audio.read(1024 * 1024):
                temp_audio.write(chunk)
        if os.path.getsize(temp_path) == 0:
            raise HTTPException(status_code=400, detail="The recording is empty")

        loop = __import__("asyncio").get_running_loop()
        result = await loop.run_in_executor(_transcription_pool, _transcribe_audio_file, temp_path)
        if not result["transcript_text"]:
            raise HTTPException(status_code=422, detail="No speech could be recognized in the recording")
        return {"transcript_id": str(uuid.uuid4()), "question_id": question_id, **result}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Audio transcription failed: {exc}") from exc
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


def _create_session(candidate_id: str, total_questions: int = 5):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "session_id": session_id,
        "candidate_id": candidate_id,
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "status": "active",
        "events": [],
        "total_questions": total_questions,
        "answered_questions": 0,
        "answers": [],
        "current_question": {
            "question_id": "q1",
            "question": "Tell me about yourself — specifically your background and what brought you to apply for this role.",
            "category": "opening",
            "version": 1,
            "dispatched_at": datetime.utcnow().isoformat(),
        },
        "question_history": [],
        "question_queue": [
            {"question_id": "q1", "question": "Tell me about yourself — specifically your background and what brought you to apply for this role.", "category": "opening"},
            {"question_id": "q2", "question": "Looking at your resume, what project are you most proud of and why?", "category": "resume"},
            {"question_id": "q3", "question": "Walk me through a challenging technical problem you solved and the trade-offs you made.", "category": "technical"},
            {"question_id": "q4", "question": "Tell me about a time you disagreed with a teammate on a technical decision.", "category": "behavioural"},
        ],
    }
    db.add("interviews", session)
    return session


@router.post("/sessions", status_code=201)
async def create_interview_session(candidate_id: str, total_questions: int = 5):
    return _create_session(candidate_id, total_questions)


@router.post("/", status_code=201)
async def create_interview(candidate_id: str, total_questions: int = 5):
    # Keep the original route as a compatibility alias.
    return _create_session(candidate_id, total_questions)


@router.get("/{session_id}")
async def get_interview(session_id: str):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/{session_id}/complete")
async def complete_interview_session(session_id: str, summary: Optional[Dict] = Body(default=None)):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session.get("status") == "active":
        changes = {
            "status": "completed",
            "ended_at": datetime.utcnow().isoformat(),
        }
        if summary is not None:
            changes["completion_summary"] = summary
        session = db.update("interviews", session_id, changes)

    return session


@router.post("/{session_id}/question")
async def dispatch_interview_question(session_id: str, question: InterviewQuestionDispatch):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.get("status") != "active":
        raise HTTPException(status_code=409, detail="Interview session is not active")
    previous = session.get("current_question") or {}
    current = {
        **question.model_dump(),
        "version": int(previous.get("version", 0)) + 1,
        "dispatched_at": datetime.utcnow().isoformat(),
    }
    history = session.get("question_history", [])
    history.append(current)
    events = session.get("events", [])
    events.append({"event_type": "question_dispatched", "timestamp": current["dispatched_at"], "details": current})
    db.update("interviews", session_id, {"current_question": current, "question_history": history, "events": events})
    return current


@router.put("/{session_id}/questions/queue")
async def update_interview_question_queue(session_id: str, update: InterviewQuestionQueueUpdate):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    queue = [question.model_dump() for question in update.questions]
    db.update("interviews", session_id, {"question_queue": queue})
    return {"questions": queue}


@router.post("/{session_id}/questions/from-resume")
async def generate_question_from_resume(session_id: str, request: InterviewQuestionGenerationRequest):
    if not db.get("interviews", session_id):
        raise HTTPException(status_code=404, detail="Interview session not found")
    try:
        question = await interview_service.generate_question(request.model_dump())
        return [question]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Gemma question generation failed: {exc}") from exc


@router.post("/{session_id}/gaze")
async def update_interview_gaze(session_id: str, update: InterviewGazeUpdate):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return interview_service.update_gaze_status(
        session_id,
        update.model_dump(mode="json"),
    )


@router.post("/{session_id}/answers", status_code=201)
async def submit_interview_answer(
    session_id: str,
    submission: InterviewAnswerSubmission,
    background_tasks: BackgroundTasks,
):
    session = db.get("interviews", session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    result = await interview_service.submit_answer(
        session_id,
        submission.model_dump(mode="json"),
    )
    if result.get("error") == "Interview session is not active":
        raise HTTPException(status_code=409, detail=result["error"])
    background_tasks.add_task(
        interview_service.analyze_saved_answer,
        session_id,
        result["id"],
        submission.question,
        submission.transcript,
    )
    return result


@router.post("/{session_id}/analyze-response")
async def analyze_interview_response(session_id: str, request: InterviewResponseAnalysisRequest):
    if not db.get("interviews", session_id):
        raise HTTPException(status_code=404, detail="Interview session not found")
    result = await interview_service.analyze_response(request.question, request.transcript)
    return {"question_id": request.question_id, **result}


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
