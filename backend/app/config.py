from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DEMO_MODE: bool = True
    AI_DEMO_MODE: Optional[bool] = None
    GEMMA_API_KEY: Optional[str] = None
    GEMMA_API_BASE_URL: str = "http://localhost:11434/api"
    GEMMA_MODEL: str = "gemma2:9b"
    WHISPER_MODEL: str = "tiny"
    DATABASE_BACKEND: str = "mongodb"
    MONGODB_URI: Optional[str] = None
    MONGODB_DATABASE: str = "trusthire"
    FRONTEND_ORIGINS: str = "http://localhost:3000"

    # Resolve the backend config from this file, not the shell's working
    # directory. This keeps `backend/.env` active when Uvicorn is launched
    # from either the repository root or the backend directory.
    model_config = {
        "env_file": str(Path(__file__).resolve().parents[1] / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
