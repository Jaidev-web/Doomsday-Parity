from pydantic_settings import BaseSettings
from typing import Optional


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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
