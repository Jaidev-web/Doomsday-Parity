from fastapi import APIRouter, HTTPException

from app.db import db
from app.services.identity_service import identity_service

router = APIRouter(prefix="/candidates/{candidate_id}", tags=["identity"])


@router.post("/verify/identity")
async def verify_identity(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    results = identity_service.run_full_identity_check(candidate_id)
    return {"candidate_id": candidate_id, "results": results}


@router.get("/identity")
async def get_identity(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    results = db.list("verifications", {"candidate_id": candidate_id, "module": "identity"})
    return {"candidate_id": candidate_id, "results": results}
