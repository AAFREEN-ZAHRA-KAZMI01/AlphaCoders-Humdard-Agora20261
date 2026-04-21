import uuid
import enum
from sqlalchemy import Column, String, Boolean, Float, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base


class MediaType(str, enum.Enum):
    image = "image"
    video = "video"


class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=True)
    has_media = Column(Boolean, nullable=False, default=False)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="posts")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="post")


class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String, nullable=False)
    media_type = Column(Enum(MediaType, name="mediatype"), nullable=False)
    # NULL = not yet analyzed; True/False = result from ML service
    is_fake = Column(Boolean, nullable=True)
    fake_confidence = Column(Float, nullable=True)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)

    post = relationship("Post", back_populates="media")
