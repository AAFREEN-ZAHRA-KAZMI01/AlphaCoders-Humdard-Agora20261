import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException, status
from pydantic import BaseModel

from .model import FakeDetector
from .tasks import run_analysis

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")

detector = FakeDetector()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await detector.load()
    yield


app = FastAPI(title="HumDard ML Service", version="0.1.0", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    image_url: str
    post_media_id: str


class AnalyzeResponse(BaseModel):
    message: str
    post_media_id: str


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest, background_tasks: BackgroundTasks):
    if not body.image_url.startswith(("http://", "https://")):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "image_url must be an http(s) URL")
    background_tasks.add_task(run_analysis, body.image_url, body.post_media_id, detector)
    return AnalyzeResponse(message="Analysis queued", post_media_id=body.post_media_id)


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": detector.model_loaded}
