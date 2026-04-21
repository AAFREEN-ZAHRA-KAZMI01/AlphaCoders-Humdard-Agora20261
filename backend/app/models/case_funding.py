import uuid
import enum
from sqlalchemy import (
    Column, String, Boolean, Text, Enum, DateTime, ForeignKey, Numeric, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base


class CaseCategory(str, enum.Enum):
    waste = "waste"
    drainage = "drainage"
    pothole = "pothole"


class CaseStatus(str, enum.Enum):
    reported = "reported"
    verified = "verified"
    funded = "funded"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class LedgerType(str, enum.Enum):
    funding = "funding"
    verification = "verification"
    milestone = "milestone"
    withdrawal = "withdrawal"


class MilestoneStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(
        Enum(CaseStatus, name="casestatus"),
        nullable=False,
        default=CaseStatus.reported,
        server_default=CaseStatus.reported.value,
    )
    total_funds = Column(Numeric(12, 2), nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    post = relationship("Post", backref="case", uselist=False)
    ledger_entries = relationship(
        "Ledger",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Ledger.timestamp",
    )
    milestones = relationship(
        "Milestone",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Milestone.created_at",
    )


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_type = Column(Enum(LedgerType, name="ledgertype"), nullable=False)
    from_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False, default=0, server_default="0")
    note = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, nullable=False, default=False, server_default="false")
    hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    case = relationship("Case", back_populates="ledger_entries")
    from_user = relationship("User", foreign_keys=[from_user_id])


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum(MilestoneStatus, name="milestonestatus"),
        nullable=False,
        default=MilestoneStatus.pending,
        server_default=MilestoneStatus.pending.value,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    case = relationship("Case", back_populates="milestones")
    creator = relationship("User", foreign_keys=[created_by])
