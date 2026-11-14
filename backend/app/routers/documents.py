from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from datetime import datetime
from pathlib import Path
import logging
import uuid

from app.models.document import DocumentResponse
from app.db import db
from app.config import settings
try:
    from app.db.mongodb import MongoDB
except ImportError:
    MongoDB = None
from app.services.document_service import document_service
from app.services.document_verification_service import document_verification_service
from app.services.trust_service import trust_service

router = APIRouter(tags=["documents"])
logger = logging.getLogger(__name__)
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
MAX_EXTRACTED_TEXT_CHARS = 150_000
ALLOWED_DOCUMENT_TYPES = {"resume", "certificate", "id_document"}


@router.post("/candidates/{candidate_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    candidate_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
):
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if document_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported document type")

    filename = Path(file.filename or "unknown").name
    extension = Path(filename).suffix.lower()
    if extension not in {".pdf", ".docx", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=415, detail="Upload a PDF, DOCX, PNG, or JPG file")

    file_bytes = await file.read(MAX_DOCUMENT_BYTES + 1)
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(file_bytes) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller")

    now = datetime.utcnow()
    content_type = file.content_type or "application/octet-stream"
    document_id = str(uuid.uuid4())
    storage_path = None
    if not settings.DEMO_MODE:
        try:
            if not isinstance(db, MongoDB):
                raise HTTPException(status_code=503, detail="Persistent document storage requires MongoDB.")
            storage_path = db.store_file(candidate_id, document_id, filename, content_type, file_bytes)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Document storage upload failed (%s)", type(exc).__name__)
            raise HTTPException(status_code=503, detail="Could not save the uploaded file") from exc

    extracted_text = document_service.extract_text(file_bytes, content_type)
    text_was_truncated = len(extracted_text) > MAX_EXTRACTED_TEXT_CHARS
    if text_was_truncated:
        extracted_text = extracted_text[:MAX_EXTRACTED_TEXT_CHARS]

    doc = {
        "id": document_id,
        "candidate_id": candidate_id,
        "document_type": document_type,
        "filename": filename,
        "content_type": content_type,
        "file_size": len(file_bytes),
        "upload_date": now.isoformat(),
        "status": "analyzed",
        "extracted_text": extracted_text,
        "metadata": {
            **document_service.get_file_info(file_bytes, filename),
            "extracted_text_truncated": text_was_truncated,
        },
        "storage_path": storage_path,
    }
    try:
        db.add("documents", doc)
    except Exception as exc:
        if storage_path and not settings.DEMO_MODE:
            try:
                if isinstance(db, MongoDB):
                    db.delete_file(storage_path)
            except Exception:
                logger.warning("Could not clean up unindexed document file %s", storage_path)
        logger.exception("Could not save candidate document metadata (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Could not save document metadata") from exc

    # --- Gemma AI verification pipeline ---
    try:
        verification_results = await document_verification_service.verify_document(doc, candidate)
        for result in verification_results:
            try:
                db.add("verifications", result)
            except Exception:
                pass  # Don't fail the upload if storing a verification fails
        # Recalculate trust score with the new verification data
        trust_service.calculate_trust_score(candidate_id)
    except Exception as exc:
        # Verification failure must NOT fail the upload – log and continue
        logger.warning("Gemma verification failed for doc %s: %s", document_id, exc)

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


@router.get("/candidates/{candidate_id}/verifications")
async def list_candidate_verifications(candidate_id: str):
    """Return all AI verification results for a candidate."""
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    results = db.list("verifications", {"candidate_id": candidate_id})
    return {"candidate_id": candidate_id, "results": results}


@router.post("/candidates/{candidate_id}/verify")
async def trigger_verification(candidate_id: str):
    """
    Re-run Gemma AI verification over all uploaded documents for a candidate.
    Returns the updated verification list and recalculated trust score.
    """
    candidate = db.get("candidates", candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    documents = db.list("documents", {"candidate_id": candidate_id})
    all_results = []

    for doc in documents:
        try:
            results = await document_verification_service.verify_document(doc, candidate)
            for result in results:
                try:
                    db.add("verifications", result)
                    all_results.append(result)
                except Exception:
                    pass
        except Exception as exc:
            logger.warning("Verification failed for doc %s: %s", doc.get("id"), exc)

    trust = trust_service.calculate_trust_score(candidate_id)
    return {
        "candidate_id": candidate_id,
        "verifications": all_results,
        "trust": trust,
    }
