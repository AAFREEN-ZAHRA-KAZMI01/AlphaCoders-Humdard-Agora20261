import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.post import Post
from ...models.social import Comment, Like, Notification, NotificationType
from ...models.user import User
from ...schemas.post import (
    CommentCreateRequest, CommentResponse,
    LikeResponse, PaginatedComments,
)
from ..deps import get_current_user

router = APIRouter(prefix="/posts", tags=["interactions"])


def _get_post_or_404(post_id: UUID, db: Session) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return post


def _notify(db: Session, recipient_id: UUID, sender_id: UUID, ntype: NotificationType, message: str, post_id: UUID):
    if recipient_id == sender_id:
        return
    db.add(Notification(
        recipient_user_id=recipient_id,
        sender_user_id=sender_id,
        type=ntype,
        message=message,
        post_id=post_id,
    ))


@router.post("/{post_id}/like", response_model=LikeResponse)
async def toggle_like(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(post_id, db)
    existing = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()

    if existing:
        db.delete(existing)
    else:
        db.add(Like(post_id=post_id, user_id=current_user.id))
        _notify(db, post.user_id, current_user.id, NotificationType.like, "Someone liked your post", post_id)

    db.commit()
    count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    liked_by_me = existing is None  # was just added if it didn't exist before
    return LikeResponse(count=count, liked_by_me=liked_by_me)


@router.get("/{post_id}/likes", response_model=LikeResponse)
async def get_likes(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_post_or_404(post_id, db)
    count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    liked_by_me = bool(db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first())
    return LikeResponse(count=count, liked_by_me=liked_by_me)


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED, response_model=CommentResponse)
async def add_comment(
    post_id: UUID,
    body: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(post_id, db)
    comment = Comment(post_id=post_id, user_id=current_user.id, content=body.content)
    db.add(comment)
    _notify(db, post.user_id, current_user.id, NotificationType.comment, "Someone commented on your post", post_id)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/{post_id}/comments", response_model=PaginatedComments)
async def get_comments(
    post_id: UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_post_or_404(post_id, db)
    size = min(size, 100)
    total = db.query(func.count(Comment.id)).filter(Comment.post_id == post_id).scalar() or 0
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return PaginatedComments(
        items=comments, total=total, page=page, size=size,
    )


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.post_id == post_id).first()
    if not comment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your comment")
    db.delete(comment)
    db.commit()
