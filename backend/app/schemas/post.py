from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from ..models.post import MediaType

_MINIO_PREFIX = "http://minio:9000/humdard-media/"


class PostMediaResponse(BaseModel):
    id: UUID
    media_url: str
    media_type: MediaType
    is_fake: Optional[bool] = None
    fake_confidence: Optional[float] = None
    analyzed_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

    @field_validator("media_url", mode="before")
    @classmethod
    def normalize_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith(_MINIO_PREFIX):
            return "/files/" + v[len(_MINIO_PREFIX):]
        return v


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    content: Optional[str] = None
    has_media: bool
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    media: list[PostMediaResponse] = []
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    items: list[PostResponse]
    total: int
    page: int
    size: int
    pages: int


class LikeResponse(BaseModel):
    count: int
    liked_by_me: bool


class CommentCreateRequest(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    model_config = {"from_attributes": True}


class PaginatedComments(BaseModel):
    items: list[CommentResponse]
    total: int
    page: int
    size: int
