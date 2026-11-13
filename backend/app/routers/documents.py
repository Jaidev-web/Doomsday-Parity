from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from datetime import datetime
import uuid

from app.models.document import DocumentResponse
from app.db import db
from app.services.document_service import document_service

router = APIRouter(tags=["documents"])


@router.post("/candidates/{candidate_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    candidate_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    file_bytes = await file.read()
    now = datetime.utcnow()

    extracted_text = document_service.extract_text(file_bytes, file.content_type or "")

    doc = {
        "id": str(uuid.uuid4()),
        "candidate_id": candidate_id,
        "document_type": document_type,
        "filename": file.filename or "unknown",
        "content_type": file.content_type or "application/octet-stream",
        "file_size": len(file_bytes),
        "upload_date": now.isoformat(),
        "status": "analyzed",
        "extracted_text": extracted_text,
        "metadata": document_service.get_file_info(file_bytes, file.filename or "unknown"),
    }
    db.add("documents", doc)
    return doc


@router.get("/candidates/{candidate_id}/documents", response_model=List[DocumentResponse])
async def list_candidate_documents(candidate_id: str):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db.list("documents", {"candidate_id": candidate_id})


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str):
    doc = db.get("documents", doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
