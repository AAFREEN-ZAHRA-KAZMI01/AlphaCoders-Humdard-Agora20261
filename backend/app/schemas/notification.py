from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from ..models.social import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    type: NotificationType
    message: str
    is_read: bool
    sender_user_id: Optional[UUID] = None
    post_id: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class PaginatedNotifications(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    size: int
    unread_count: int
