"""
SleepSettings ORM モデル
ユーザーごとの睡眠設定（起床時刻・睡眠時間・ICS URL・今日のオーバーライド等）
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.infrastructure.persistence.database import Base


class SleepSettings(Base):
    """睡眠設定 ORM モデル（1 ユーザー 1 行）"""

    __tablename__ = "sleep_settings"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    wake_up_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    wake_up_minute: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sleep_duration_hours: Mapped[int] = mapped_column(
        Integer, nullable=False, default=8
    )
    resilience_window_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=20
    )
    mission_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    mission_target: Mapped[str | None] = mapped_column(
        String(255), nullable=True, default=None
    )
    preparation_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=30
    )
    ics_url: Mapped[str | None] = mapped_column(
        String(2048), nullable=True, default=None
    )

    # 今日のオーバーライド（nullable）
    override_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, default=None
    )
    override_sleep_hour: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )
    override_sleep_minute: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )
    override_wake_hour: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )
    override_wake_minute: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
