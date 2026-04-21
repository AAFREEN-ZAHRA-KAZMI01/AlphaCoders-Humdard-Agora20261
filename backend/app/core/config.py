import json
from functools import lru_cache
from urllib.parse import quote
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # PostgreSQL
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_CACHE_TTL: int = 3600

    @computed_field
    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            pwd = quote(self.REDIS_PASSWORD, safe="")
            return f"redis://:{pwd}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@humdard.pk"
    SMTP_FROM_NAME: str = "HumDard"
    SMTP_TLS: bool = True

    # MinIO
    MINIO_ROOT_USER: str = "humdard_admin"
    MINIO_ROOT_PASSWORD: str = "humdard_secret_123"
    MINIO_ENDPOINT: str = "http://minio:9000"
    MINIO_BUCKET: str = "humdard-media"

    # ML Service
    ML_SERVICE_URL: str = "http://ml_service:8001"
    ML_SERVICE_API_KEY: str = ""
    ML_REQUEST_TIMEOUT: int = 30

    # Google Maps
    GOOGLE_MAPS_API_KEY: str = ""

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = '["http://localhost", "http://localhost:3000"]'

    def cors_origins_list(self) -> list[str]:
        stripped = self.CORS_ORIGINS.strip()
        if stripped.startswith("["):
            return json.loads(stripped)
        return [o.strip() for o in stripped.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
