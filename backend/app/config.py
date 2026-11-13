from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DEMO_MODE: bool = True
    DEMO_AUTH_ENABLED: bool = False
    DEMO_CANDIDATE_EMAIL: str = ""
    DEMO_CANDIDATE_PASSWORD: str = ""
    DEMO_HR_EMAIL: str = ""
    DEMO_HR_PASSWORD: str = ""
    AI_DEMO_MODE: Optional[bool] = None
    GEMMA_API_KEY: Optional[str] = None
    GEMMA_API_BASE_URL: str = "http://localhost:11434/api"
    GEMMA_MODEL: str = "gemma2:9b"
    WHISPER_MODEL: str = "tiny"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FRONTEND_ORIGINS: str = "http://localhost:3000"

    # Resolve the backend config from this file, not the shell's working
    # directory. This keeps `backend/.env` active when Uvicorn is launched
    # from either the repository root or the backend directory.
    model_config = {
        "env_file": str(Path(__file__).resolve().parents[1] / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
