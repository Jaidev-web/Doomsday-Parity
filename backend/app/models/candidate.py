from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    position: str
    trust_score: float = 0.0
    overall_status: str = "pending"
    credential_status: str = "pending"
    identity_status: str = "pending"
    interview_status: str = "pending"
    created_at: datetime
    updated_at: datetime
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    avatar_url: Optional[str] = None
