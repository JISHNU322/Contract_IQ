from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Try to read .env from current directory or parent directory
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_ignore_empty=True, 
        extra="ignore"
    )
    PROJECT_NAME: str = "ContractIQ AI"
    SECRET_KEY: str = "supersecretkey_changeme_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days
    DATABASE_URL: str = "sqlite:///./contractiq.db"
    GEMINI_API_KEY: str = ""
    API_V1_STR: str = "/api"
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"
    )

settings = Settings()
