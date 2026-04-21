from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class AnalysisResultResponse(BaseModel):
    post_media_id: UUID
    is_fake: Optional[bool] = None
    fake_confidence: Optional[float] = None
    analyzed_at: Optional[datetime] = None
    status: str  # "pending" | "completed"
    model_config = {"from_attributes": True}


class TriggerAnalysisResponse(BaseModel):
    message: str
    post_media_id: UUID


class AnalysisCallbackRequest(BaseModel):
    is_fake: bool
    confidence: float
    label: str
