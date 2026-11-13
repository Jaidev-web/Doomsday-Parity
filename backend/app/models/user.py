from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class UserBase(BaseModel):
    email: EmailStr
    role: Literal["candidate", "hr"]

class UserCreate(UserBase):
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None

class UserResponse(UserBase):
    id: str
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None

class FirebaseTokenVerifyRequest(BaseModel):
    token: str
    role: Literal["candidate", "hr"]
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None

class DemoLoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["candidate", "hr"]
