from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager


from app.routers import candidates, documents, credentials, identity, interviews, trust, ai_assistant, auth
from app.demo.seed import seed_demo_data
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed demo data
    if settings.DEMO_MODE:
        seed_demo_data()
    yield
    # Shutdown: nothing to clean up for in-memory DB


app = FastAPI(
    title="TrustHire API",
    description="AI-assisted candidate fraud detection platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api prefix
app.include_router(candidates.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(credentials.router, prefix="/api")
app.include_router(identity.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(trust.router, prefix="/api")
app.include_router(ai_assistant.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "TrustHire API", "version": "1.0.0", "demo_mode": settings.DEMO_MODE}


@app.get("/health")
async def health():
    return {"status": "healthy"}
