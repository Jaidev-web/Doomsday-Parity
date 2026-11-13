from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from app.models.candidate import CandidateCreate, CandidateResponse, CandidateUpdate
from app.db import db

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.post("/", response_model=CandidateResponse, status_code=201)
async def create_candidate(candidate: CandidateCreate):
    now = datetime.utcnow()
    email = str(candidate.email).lower()
    candidate_accounts = db.list("users", filter_by={"email": email, "role": "candidate"})
    data = {
        "id": str(uuid.uuid4()),
        **candidate.model_dump(),
        "email": email,
        "user_id": candidate_accounts[0]["id"] if candidate_accounts else None,
        "trust_score": 0.0,
        "overall_status": "pending",
        "credential_status": "pending",
        "identity_status": "pending",
        "interview_status": "pending",
        "avatar_url": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    db.add("candidates", data)
    if candidate_accounts:
        db.update("users", candidate_accounts[0]["id"], {"candidate_id": data["id"]})
    return data


@router.get("/", response_model=List[CandidateResponse])
async def list_candidates():
    return db.list("candidates")


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(candidate_id: str, update: CandidateUpdate):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    update_data = update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    updated = db.update("candidates", candidate_id, update_data)
    return updated


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(candidate_id: str):
    if not db.delete("candidates", candidate_id):
        raise HTTPException(status_code=404, detail="Candidate not found")
