from fastapi import APIRouter, HTTPException
from app.models.user import FirebaseTokenVerifyRequest, UserResponse
from app.db import db
from firebase_admin import auth as firebase_auth
from app.db.firebase import get_firebase_admin_app
from app.config import settings
from app.models.user import DemoLoginRequest
from secrets import compare_digest
import logging
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

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

@router.post("/demo-login")
async def demo_login(request: DemoLoginRequest):
    if not settings.DEMO_MODE or not settings.DEMO_AUTH_ENABLED:
        return {"enabled": False, "authenticated": False}

    if request.role == "candidate":
        expected_email = settings.DEMO_CANDIDATE_EMAIL
        expected_password = settings.DEMO_CANDIDATE_PASSWORD
        name = "Test Candidate"
        user_id = "demo-candidate"
    else:
        expected_email = settings.DEMO_HR_EMAIL
        expected_password = settings.DEMO_HR_PASSWORD
        name = "Demo HR"
        user_id = "demo-hr"

    if not expected_email or not expected_password:
        return {"enabled": False, "authenticated": False}

    email_matches = compare_digest(request.email.lower(), expected_email.lower())
    password_matches = compare_digest(request.password, expected_password)
    if not (email_matches and password_matches):
        return {"enabled": True, "authenticated": False}

    user_data = {
        "id": user_id,
        "email": expected_email.lower(),
        "role": request.role,
        "name": name,
        "phone": None,
        "company": "Demo Organization" if request.role == "hr" else None,
        "title": "Recruiter" if request.role == "hr" else None,
    }
    existing = db.list("users", filter_by={"email": user_data["email"], "role": request.role})
    if existing:
        user_data.update(existing[0])
    else:
        db.add("users", user_data)

    return {"enabled": True, "authenticated": True, "user": user_response(user_data).model_dump(mode="json")}

@router.post("/verify-token", response_model=UserResponse)
async def verify_token(request: FirebaseTokenVerifyRequest):
    try:
        app = get_firebase_admin_app()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Firebase Admin is not configured: {exc}") from exc
    try:
        decoded_token = firebase_auth.verify_id_token(request.token, app=app)
    except firebase_auth.CertificateFetchError as exc:
        logger.warning("Could not fetch Firebase token verification certificates: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Firebase token verification is temporarily unavailable. Check backend network access.",
        ) from exc
    except firebase_auth.InvalidIdTokenError as exc:
        logger.info("Rejected Firebase ID token (%s)", type(exc).__name__)
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token") from exc
    except Exception as exc:
        logger.exception("Unexpected Firebase ID-token verification error (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Firebase token verification is unavailable") from exc

    email = decoded_token.get("email")
    uid = decoded_token.get("uid")
    if not email or not uid or decoded_token.get("email_verified") is not True:
        logger.info("Rejected Firebase token without a verified email or user ID")
        raise HTTPException(status_code=401, detail="Use an email sign-in link for a verified account")
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
