from pydantic_settings import BaseSettings
from typing import Optional


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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
