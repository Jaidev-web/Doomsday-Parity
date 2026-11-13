from fastapi import APIRouter, HTTPException
from typing import List

from app.db import db
from app.services.credential_service import credential_service

router = APIRouter(prefix="/candidates/{candidate_id}", tags=["credentials"])


@router.post("/verify/credentials")
async def verify_credentials(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    results = credential_service.run_full_credential_check(candidate_id)
    return {"candidate_id": candidate_id, "results": results}


@router.get("/credentials")
async def get_credentials(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    results = db.list("verifications", {"candidate_id": candidate_id, "module": "credential"})
    return {"candidate_id": candidate_id, "results": results}
