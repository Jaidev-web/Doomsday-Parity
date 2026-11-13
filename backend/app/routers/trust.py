from fastapi import APIRouter, HTTPException

from app.db import db
from app.services.trust_service import trust_service

router = APIRouter(prefix="/candidates/{candidate_id}/trust", tags=["trust"])


@router.post("/calculate")
async def calculate_trust(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    result = trust_service.calculate_trust_score(candidate_id)
    return result


@router.get("/")
async def get_trust(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    breakdown = trust_service.get_trust_breakdown(candidate_id)
    if not breakdown:
        raise HTTPException(status_code=404, detail="Trust data not found")
    return breakdown
