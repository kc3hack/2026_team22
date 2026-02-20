"""ヘルスチェックエンドポイント"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.persistence.database import get_db

router = APIRouter()


@router.get("/health")
async def health_check():
    """API のヘルスチェック"""
    return {
        "status": "healthy",
        "env": settings.ENV,
    }


@router.get("/health/db")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    """データベース接続のヘルスチェック"""
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
