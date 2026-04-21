from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Internal communication
    BACKEND_URL: str = "http://backend:8000"
    ML_SERVICE_API_KEY: str = ""

    # Model selection
    # Set HF_USE_LOCAL_MODEL=true to load the model into memory at startup
    # (requires torch + transformers in requirements; adds ~2 GB to container)
    ML_MODEL_ID: str = "umm-maybe/autotrain-image-classification-fake-real"
    HF_USE_LOCAL_MODEL: bool = False
    HF_API_TOKEN: str = ""          # needed for HF Inference API (Option B)

    # Limits
    MAX_IMAGE_MB: int = 20


@lru_cache
def get_settings() -> Settings:
    return Settings()
