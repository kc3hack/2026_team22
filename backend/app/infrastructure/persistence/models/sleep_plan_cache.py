"""
SleepPlanCache ORM モデル
朝・ホーム画面用の週間睡眠プランキャッシュ（1ユーザー1行で管理）
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base


class SleepPlanCache(Base):
    """週間睡眠プランキャッシュ ORM モデル"""

    __tablename__ = "sleep_plan_cache"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    signature_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    plan_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
