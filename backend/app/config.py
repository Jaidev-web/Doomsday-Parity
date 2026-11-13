from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DEMO_MODE: bool = True
    GEMMA_API_KEY: Optional[str] = None
    GEMMA_API_BASE_URL: str = "http://localhost:11434/api"
    GEMMA_MODEL: str = "gemma2:9b"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
