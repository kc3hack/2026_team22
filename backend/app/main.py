"""
SleepSupportApp FastAPI Backend
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import health, users

# モデルを登録（init_dbでテーブル作成するため）
import app.models  # noqa: F401, E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時の処理
    print(f"🚀 Starting SleepSupportApp API ({settings.ENV} mode)")
    await init_db()
    yield
    # 終了時の処理
    print("👋 Shutting down SleepSupportApp API")


app = FastAPI(
    title="SleepSupportApp API",
    description="睡眠サポートアプリのバックエンドAPI",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(users.router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "SleepSupportApp API",
        "version": "0.1.0",
        "docs": "/api/docs" if settings.DEBUG else "disabled",
    }
