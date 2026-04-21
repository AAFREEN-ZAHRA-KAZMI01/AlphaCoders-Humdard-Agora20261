import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.database import Base, engine
from .models import user, profile, post, otp, social, case_funding  # noqa: F401 — register all tables
from .api.routers import auth, users, posts, interactions, notifications, media, cases
from .utils.storage import ensure_bucket

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except Exception as e:
            if attempt == 9:
                raise
            time.sleep(3)
    ensure_bucket()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="HumDard API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api")
app.include_router(users.router,         prefix="/api")
app.include_router(posts.router,         prefix="/api")
app.include_router(interactions.router,  prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(media.router,         prefix="/api")
app.include_router(cases.router,         prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
