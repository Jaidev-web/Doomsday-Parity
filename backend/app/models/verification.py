from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class VerificationResult(BaseModel):
    id: str
    candidate_id: str
    module: str  # credential, identity, interview
    check_type: str  # e.g. employment_dates, cert_metadata, github_analysis
    status: str  # passed, failed, warning, pending
    severity: str  # low, medium, high, critical
    title: str
    explanation: str
    evidence: Optional[List[str]] = None
    timestamp: datetime
