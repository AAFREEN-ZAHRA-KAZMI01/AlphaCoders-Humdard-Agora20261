import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.post import MediaType, Post, PostMedia
from ...models.social import Comment, Like
from ...schemas.post import PaginatedPosts, PostResponse
from ...utils.storage import upload_file
from ..deps import get_current_user
from ...models.user import User

router = APIRouter(prefix="/posts", tags=["posts"])

_ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_VIDEO = {"video/mp4", "video/quicktime", "video/webm"}


def _media_type(content_type: str) -> MediaType:
    if content_type in _ALLOWED_IMAGE:
        return MediaType.image
    if content_type in _ALLOWED_VIDEO:
        return MediaType.video
    raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported media type: {content_type}")


def _enrich(post: Post, db: Session, current_user_id: UUID) -> dict:
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar() or 0
    liked_by_me = bool(
        db.query(Like).filter(Like.post_id == post.id, Like.user_id == current_user_id).first()
    )
    base = PostResponse.model_validate(post).model_dump()
    base.update(like_count=like_count, comment_count=comment_count, liked_by_me=liked_by_me)
    return base


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PostResponse)
async def create_post(
    content: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not files and not content and not location_name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Post must have content, media, or a location")

    post = Post(
        user_id=current_user.id,
        content=content,
        has_media=bool(files),
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(post)
    db.flush()  # get post.id before uploading

    for file in files:
        media_type = _media_type(file.content_type or "")
        ext = (file.filename or "file").rsplit(".", 1)[-1]
        data = await file.read()
        url = await upload_file(data, f"posts/{post.id}", ext, file.content_type or "application/octet-stream")
        db.add(PostMedia(post_id=post.id, media_url=url, media_type=media_type))

    db.commit()
    db.refresh(post)
    return _enrich(post, db, current_user.id)


@router.get("/", response_model=PaginatedPosts)
async def get_feed(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    size = min(size, 100)
    total = db.query(func.count(Post.id)).scalar() or 0
    posts = (
        db.query(Post)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return PaginatedPosts(
        items=[_enrich(p, db, current_user.id) for p in posts],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return _enrich(post, db, current_user.id)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your post")
    db.delete(post)
    db.commit()
