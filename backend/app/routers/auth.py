from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserResponse
from app.db import db
from firebase_admin import auth as firebase_auth
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

def user_response(user_data: dict) -> UserResponse:
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        role=user_data["role"],
        name=user_data["name"],
        phone=user_data.get("phone"),
    )

@router.post("/verify-token", response_model=UserResponse)
async def verify_token(token: str, role: str):
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token["email"]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    users = db.list("users", filter_by={"email": email.lower(), "role": role})
    if not users:
        # Create new user if not exists
        user_data = {
            "email": email.lower(),
            "role": role,
            "id": str(uuid.uuid4()),
            "name": decoded_token.get("name", "Unknown"),
            "phone": None
        }
        db.add("users", user_data)
        return user_response(user_data)

    return user_response(users[0])
