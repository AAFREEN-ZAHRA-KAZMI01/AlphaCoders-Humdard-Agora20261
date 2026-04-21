from typing import AsyncGenerator
from jose import JWTError
import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..core.database import get_db
from ..core.security import decode_token
from ..models.user import User

settings = get_settings()
_bearer = HTTPBearer()


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> User:
    token = credentials.credentials
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except JWTError:
        raise exc

    if payload.get("type") != "access":
        raise exc

    if await redis.get(f"blacklist:{token}"):
        raise exc

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise exc
    return user
