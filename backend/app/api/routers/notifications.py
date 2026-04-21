import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.social import Notification
from ...models.user import User
from ...schemas.notification import NotificationResponse, PaginatedNotifications
from ..deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=PaginatedNotifications)
async def list_notifications(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    size = min(size, 100)
    base = db.query(Notification).filter(Notification.recipient_user_id == current_user.id)
    total = base.with_entities(func.count()).scalar() or 0
    unread_count = base.filter(Notification.is_read.is_(False)).with_entities(func.count()).scalar() or 0
    items = (
        base.order_by(Notification.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return PaginatedNotifications(
        items=items, total=total, page=page, size=size,
        unread_count=unread_count,
    )


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
