from fastapi import APIRouter, HTTPException
from app.models.user import FirebaseTokenVerifyRequest, UserResponse
from app.db import db
from firebase_admin import auth as firebase_auth
from app.db.firebase import get_firebase_admin_app
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

def user_response(user_data: dict) -> UserResponse:
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        role=user_data["role"],
        name=user_data["name"],
        phone=user_data.get("phone"),
        company=user_data.get("company"),
        title=user_data.get("title"),
    )

@router.post("/verify-token", response_model=UserResponse)
async def verify_token(request: FirebaseTokenVerifyRequest):
    try:
        app = get_firebase_admin_app()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Firebase Admin is not configured: {exc}") from exc
    try:
        decoded_token = firebase_auth.verify_id_token(request.token, app=app)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token") from exc

    email = decoded_token.get("email")
    uid = decoded_token.get("uid")
    if not email or not uid or decoded_token.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Firebase token must contain a verified email and user ID")
    email = email.lower()

    users = db.list("users", filter_by={"email": email, "role": request.role})
    if not users:
        user_data = {
            "email": email,
            "role": request.role,
            "id": f"{request.role}_{uid}_{uuid.uuid4().hex[:8]}",
            "firebase_uid": uid,
            "name": request.name or decoded_token.get("name") or email.split("@")[0],
            "phone": request.phone,
            "company": request.company,
            "title": request.title,
        }
        db.add("users", user_data)
        return user_response(user_data)

    user = users[0]
    updates = {"firebase_uid": uid}
    for field in ("name", "phone", "company", "title"):
        value = getattr(request, field)
        if value:
            updates[field] = value
    user.update(updates)
    db.update("users", user["id"], updates)
    return user_response(user)
