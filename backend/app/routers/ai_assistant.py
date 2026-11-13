from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid

from app.models.ai_review import AIQuestion, AIResponse, AIHistory
from app.db import db
from app.services.ai_service import ai_service

router = APIRouter(prefix="/candidates/{candidate_id}/ai", tags=["ai_assistant"])


@router.post("/ask", response_model=AIResponse)
async def ask_ai(candidate_id: str, question: AIQuestion):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Build context from candidate data
    context = question.context or ""
    full_prompt = f"Candidate: {candidate.get('name')}, Position: {candidate.get('position')}. "
    full_prompt += f"Trust Score: {candidate.get('trust_score')}. "
    if context:
        full_prompt += f"Context: {context}. "
    full_prompt += f"Question: {question.question}"

    answer = await ai_service._call_gemma(full_prompt)

    response = {
        "id": str(uuid.uuid4()),
        "candidate_id": candidate_id,
        "question": question.question,
        "answer": answer,
        "model_used": "demo" if not answer or "[Demo Mode]" in answer else ai_service.model,
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Store in history
    history = db.get("ai_history", f"ai-{candidate_id}")
    if history:
        convos = history.get("conversations", [])
        convos.append(response)
        db.update("ai_history", f"ai-{candidate_id}", {"conversations": convos})
    else:
        db.add("ai_history", {
            "id": f"ai-{candidate_id}",
            "candidate_id": candidate_id,
            "conversations": [response],
        })

    return response


@router.get("/history", response_model=AIHistory)
async def get_ai_history(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    history = db.get("ai_history", f"ai-{candidate_id}")
    if not history:
        return {"candidate_id": candidate_id, "conversations": []}
    return history
