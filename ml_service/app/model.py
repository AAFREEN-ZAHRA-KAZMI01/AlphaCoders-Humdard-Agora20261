"""
Fake-detection pipeline — three options in priority order:

  A  Local model via transformers (on-device, ~2 GB, fast after load)
     Enabled when: HF_USE_LOCAL_MODEL=true + torch/transformers installed

  B  HuggingFace Inference API (no local model download, needs HF_API_TOKEN)
     Enabled when: HF_API_TOKEN is set

  C  Rule-based fallback (EXIF metadata analysis, always available)
     Used when both A and B are unavailable or fail
"""

import asyncio
import io
import logging
from dataclasses import dataclass

import httpx
from PIL import Image
from PIL.ExifTags import TAGS

from .config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()

_AI_SOFTWARE = frozenset([
    "stable diffusion", "midjourney", "dall-e", "dalle", "adobe firefly",
    "imagen", "flux", "novelai", "automatic1111", "comfyui", "invokeai",
])
_EDIT_SOFTWARE = frozenset(["photoshop", "gimp", "lightroom", "affinity photo", "capture one"])


@dataclass
class Prediction:
    is_fake: bool
    confidence: float
    label: str
    method: str  # "local_model" | "hf_api" | "rule_based"


class FakeDetector:
    def __init__(self) -> None:
        self._pipe = None
        self.model_loaded: bool = False

    async def load(self) -> None:
        if not settings.HF_USE_LOCAL_MODEL:
            log.info("Local model disabled — using HF API or rule-based fallback")
            return
        try:
            loop = asyncio.get_event_loop()
            self._pipe = await loop.run_in_executor(None, self._load_pipeline)
            self.model_loaded = True
            log.info("Local model loaded: %s", settings.ML_MODEL_ID)
        except Exception as exc:
            log.warning("Could not load local model (%s) — continuing without it", exc)

    @staticmethod
    def _load_pipeline():
        from transformers import pipeline  # optional heavy dependency
        return pipeline(
            "image-classification",
            model=settings.ML_MODEL_ID,
            token=settings.HF_API_TOKEN or None,
        )

    async def predict(self, image: Image.Image) -> Prediction:
        # Option A — local model
        if self._pipe is not None:
            try:
                return await self._predict_local(image)
            except Exception as exc:
                log.warning("Local inference failed: %s — falling back", exc)

        # Option B — HuggingFace Inference API
        if settings.HF_API_TOKEN:
            try:
                return await self._predict_hf_api(image)
            except Exception as exc:
                log.warning("HF API failed: %s — falling back to rule-based", exc)

        # Option C — rule-based
        return _rule_based(image)

    async def _predict_local(self, image: Image.Image) -> Prediction:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, lambda: self._pipe(image))
        return _parse_hf_results(results, method="local_model")

    async def _predict_hf_api(self, image: Image.Image) -> Prediction:
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=95)
        img_bytes = buf.getvalue()

        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                resp = await client.post(
                    f"https://api-inference.huggingface.co/models/{settings.ML_MODEL_ID}",
                    content=img_bytes,
                    headers={
                        "Authorization": f"Bearer {settings.HF_API_TOKEN}",
                        "Content-Type": "image/jpeg",
                    },
                    timeout=60,
                )
                # 503 = model is warming up on HF free tier — wait and retry
                if resp.status_code == 503:
                    wait = resp.json().get("estimated_time", 20)
                    log.info("HF model loading, waiting %ss (attempt %d/3)", wait, attempt + 1)
                    await asyncio.sleep(min(float(wait), 30))
                    continue
                resp.raise_for_status()
                data = resp.json()
                # HF sometimes returns an error dict instead of a list
                if isinstance(data, dict) and "error" in data:
                    raise ValueError(f"HF API error: {data['error']}")
                return _parse_hf_results(data, method="hf_api")
        raise ValueError("HF API unavailable after 3 attempts")


# Keywords that indicate AI-generated / fake content across different models
_FAKE_KEYWORDS = frozenset([
    "fake", "ai", "generated", "manipulated", "forged",
    "artificial", "synthetic", "deepfake", "diffusion",
    "sdxl", "midjourney", "computer", "machine",
])


def _parse_hf_results(results: list[dict], method: str) -> Prediction:
    """
    HF classification results: [{"label": "FAKE", "score": 0.93}, ...]
    Label names vary per model; we match on common fake-indicating keywords.
    """
    fake_score = 0.0
    for r in results:
        if any(kw in r.get("label", "").lower() for kw in _FAKE_KEYWORDS):
            fake_score = max(fake_score, float(r.get("score", 0)))

    is_fake = fake_score >= 0.5
    confidence = fake_score if is_fake else (1.0 - fake_score)
    return Prediction(
        is_fake=is_fake,
        confidence=round(confidence, 4),
        label="fake" if is_fake else "real",
        method=method,
    )


def _rule_based(image: Image.Image) -> Prediction:
    """
    Lightweight EXIF metadata analysis.
    Capped at 0.90 — rule-based cannot be fully certain.
    """
    score = 0.0

    try:
        exif_raw = image._getexif()  # type: ignore[attr-defined]
        if exif_raw is None:
            score += 0.15
        else:
            exif = {TAGS.get(k, k): v for k, v in exif_raw.items()}
            software = str(exif.get("Software", "")).lower()

            if any(kw in software for kw in _AI_SOFTWARE):
                score += 0.85
            elif any(kw in software for kw in _EDIT_SOFTWARE):
                score += 0.30

            # Real photographs always have camera make/model in EXIF
            if "Make" not in exif and "Model" not in exif:
                score += 0.20

    except AttributeError:
        # PNG and some other formats have no _getexif
        score += 0.10
    except Exception as exc:
        log.debug("EXIF parse error: %s", exc)
        score += 0.10

    score = min(score, 0.90)
    is_fake = score >= 0.50
    return Prediction(
        is_fake=is_fake,
        confidence=round(score if is_fake else 1.0 - score, 4),
        label="fake" if is_fake else "real",
        method="rule_based",
    )
