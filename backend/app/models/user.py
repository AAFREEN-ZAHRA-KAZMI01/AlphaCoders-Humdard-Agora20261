import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base


class UserType(str, enum.Enum):
    citizen = "citizen"
    ngo = "ngo"
    volunteer = "volunteer"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    user_type = Column(Enum(UserType, name="usertype"), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    citizen_profile = relationship("CitizenProfile", back_populates="user", uselist=False)
    ngo_profile = relationship("NgoProfile", back_populates="user", uselist=False)
    volunteer_profile = relationship("VolunteerProfile", back_populates="user", uselist=False)
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications_received = relationship(
        "Notification", foreign_keys="Notification.recipient_user_id", back_populates="recipient"
    )
    notifications_sent = relationship(
        "Notification", foreign_keys="Notification.sender_user_id", back_populates="sender"
    )
