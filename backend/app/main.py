"""
SleepSupportApp FastAPI Backend（オニオンアーキテクチャ）
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
import app.infrastructure.persistence.models  # noqa: F401 - metadata 登録
from app.presentation.api import health, plan, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    print(f"🚀 Starting SleepSupportApp API ({settings.ENV} mode)")
    await init_db()
    yield
    print("👋 Shutting down SleepSupportApp API")


app = FastAPI(
    title="SleepSupportApp API",
    description="睡眠サポートアプリのバックエンドAPI",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

_cors_origins = ["*"] if settings.ENV == "development" else settings.CORS_ORIGINS
_cors_credentials = settings.ENV != "development"
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(plan.router, prefix=settings.API_PREFIX)  # /sleep-plans


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "SleepSupportApp API",
        "version": "0.1.0",
        "docs": "/api/docs" if settings.DEBUG else "disabled",
    }
