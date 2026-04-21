import asyncio
import io
import logging

import httpx
from PIL import Image

from .config import get_settings
from .model import FakeDetector, Prediction

log = logging.getLogger(__name__)
settings = get_settings()

_MAX_BYTES = settings.MAX_IMAGE_MB * 1024 * 1024


async def _download_image(url: str) -> Image.Image:
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=30)
        resp.raise_for_status()

    if len(resp.content) > _MAX_BYTES:
        raise ValueError(f"Image exceeds {settings.MAX_IMAGE_MB} MB limit")

    return Image.open(io.BytesIO(resp.content)).convert("RGB")


async def _callback(post_media_id: str, result: Prediction, attempt: int = 0) -> None:
    url = f"{settings.BACKEND_URL}/api/media/internal/{post_media_id}/result"
    payload = {
        "is_fake": result.is_fake,
        "confidence": result.confidence,
        "label": result.label,
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"X-API-Key": settings.ML_SERVICE_API_KEY},
                timeout=10,
            )
            resp.raise_for_status()
        log.info("Callback OK  post_media_id=%s attempt=%d", post_media_id, attempt + 1)

    except httpx.HTTPError as exc:
        if attempt < 2:  # 3 total attempts: 0, 1, 2
            delay = 2 ** attempt  # 1 s, 2 s, 4 s
            log.warning(
                "Callback failed (attempt %d/3) for %s: %s — retrying in %ds",
                attempt + 1, post_media_id, exc, delay,
            )
            await asyncio.sleep(delay)
            await _callback(post_media_id, result, attempt + 1)
        else:
            log.error(
                "All 3 callback attempts exhausted for %s: %s", post_media_id, exc
            )


async def run_analysis(image_url: str, post_media_id: str, detector: FakeDetector) -> None:
    log.info("Analysis started  post_media_id=%s", post_media_id)
    # /files/ URLs go through nginx (browser-facing); convert to internal MinIO URL for download
    if image_url.startswith("/files/"):
        image_url = "http://minio:9000/humdard-media/" + image_url[7:]
    try:
        image = await _download_image(image_url)
        result = await detector.predict(image)
        log.info(
            "Analysis done  post_media_id=%s  is_fake=%s  confidence=%.4f  method=%s",
            post_media_id, result.is_fake, result.confidence, result.method,
        )
    except Exception as exc:
        log.error("Analysis error for %s: %s", post_media_id, exc)
        result = Prediction(is_fake=False, confidence=0.0, label="error", method="error")

    await _callback(post_media_id, result)
