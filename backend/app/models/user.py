from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class UserBase(BaseModel):
    email: EmailStr
    role: Literal["candidate", "hr"]

class UserCreate(UserBase):
    name: str
    phone: Optional[str] = None

class UserResponse(UserBase):
    id: str
    name: str
    phone: Optional[str] = None
