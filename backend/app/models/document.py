from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentUpload(BaseModel):
    candidate_id: str
    document_type: str  # resume, certificate, id_document, transcript
    filename: str
    content_type: str = "application/pdf"


class DocumentResponse(BaseModel):
    id: str
    candidate_id: str
    document_type: str
    filename: str
    content_type: str
    file_size: int = 0
    upload_date: datetime
    status: str = "uploaded"  # uploaded, processing, analyzed
    extracted_text: Optional[str] = None
    metadata: Optional[dict] = None
