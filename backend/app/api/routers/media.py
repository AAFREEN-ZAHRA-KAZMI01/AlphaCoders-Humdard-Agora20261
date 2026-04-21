from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...core.database import get_db
from ...models.post import PostMedia
from ...models.user import User
from ...schemas.media import AnalysisCallbackRequest, AnalysisResultResponse, TriggerAnalysisResponse
from ..deps import get_current_user

router = APIRouter(prefix="/media", tags=["media"])
settings = get_settings()


@router.post("/analyze/{post_media_id}", response_model=TriggerAnalysisResponse)
async def trigger_analysis(
    post_media_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    media = db.query(PostMedia).filter(PostMedia.id == post_media_id).first()
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    if media.analyzed_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Media already analyzed")

    # ml_service needs an absolute URL; /files/ paths are nginx-facing only
    ml_image_url = media.media_url
    if ml_image_url.startswith("/files/"):
        ml_image_url = f"http://minio:9000/{settings.MINIO_BUCKET}/" + ml_image_url[7:]

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/analyze",
                json={"image_url": ml_image_url, "post_media_id": str(post_media_id)},
                headers={"X-API-Key": settings.ML_SERVICE_API_KEY},
                timeout=settings.ML_REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"ML service error: {exc}")

    return TriggerAnalysisResponse(message="Analysis triggered", post_media_id=post_media_id)


@router.get("/{post_media_id}/result", response_model=AnalysisResultResponse)
async def get_result(
    post_media_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    media = db.query(PostMedia).filter(PostMedia.id == post_media_id).first()
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")

    return AnalysisResultResponse(
        post_media_id=media.id,
        is_fake=media.is_fake,
        fake_confidence=media.fake_confidence,
        analyzed_at=media.analyzed_at,
        status="completed" if media.analyzed_at else "pending",
    )


@router.post("/internal/{post_media_id}/result", include_in_schema=False)
async def receive_analysis_result(
    post_media_id: UUID,
    body: AnalysisCallbackRequest,
    x_api_key: Annotated[str, Header()],
    db: Session = Depends(get_db),
):
    """Internal endpoint — called by ml_service after analysis completes."""
    if x_api_key != settings.ML_SERVICE_API_KEY:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API key")

    media = db.query(PostMedia).filter(PostMedia.id == post_media_id).first()
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")

    media.is_fake = body.is_fake
    media.fake_confidence = body.confidence
    media.analyzed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}
