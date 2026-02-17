"""
ヘルスチェックエンドポイント
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    APIのヘルスチェック
    """
    return {
        "status": "healthy",
        "env": settings.ENV,
    }


@router.get("/health/db")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    """
    データベース接続のヘルスチェック
    """
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }
