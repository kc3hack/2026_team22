"""
SleepLog ORM モデル
日ごとの睡眠ログ（スコア・気分・減点等）
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base


class SleepLog(Base):
    """睡眠ログ ORM モデル（1 ユーザーあたり日付ごとに複数行）"""

    __tablename__ = "sleep_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_sleep_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    usage_penalty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    environment_penalty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    phase1_warning: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    phase2_warning: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    light_exceeded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    noise_exceeded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
