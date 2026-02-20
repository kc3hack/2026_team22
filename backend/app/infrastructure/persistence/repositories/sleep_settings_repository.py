"""
SleepSettings リポジトリ実装
ユーザー単位で睡眠設定を 1 件取得・upsert する。
"""

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.sleep_settings import SleepSettings


class SleepSettingsRepository:
    """睡眠設定リポジトリ（1 ユーザー 1 行）"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: str) -> SleepSettings | None:
        """user_id で 1 件取得"""
        result = await self.db.execute(
            select(SleepSettings).where(SleepSettings.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        user_id: str,
        *,
        wake_up_hour: int = 7,
        wake_up_minute: int = 0,
        sleep_duration_hours: int = 8,
        resilience_window_minutes: int = 20,
        mission_enabled: bool = False,
        mission_target: str | None = None,
        preparation_minutes: int = 30,
        ics_url: str | None = None,
        override_date: date | None = None,
        override_sleep_hour: int | None = None,
        override_sleep_minute: int | None = None,
        override_wake_hour: int | None = None,
        override_wake_minute: int | None = None,
    ) -> SleepSettings:
        """
        設定を取得してあれば更新、なければ新規作成する。
        オーバーライドが None の場合は DB 上も null にし、今日のオーバーライドをクリアする。
        """
        row = await self.get_by_user_id(user_id)
        if row is None:
            row = SleepSettings(
                user_id=user_id,
                wake_up_hour=wake_up_hour,
                wake_up_minute=wake_up_minute,
                sleep_duration_hours=sleep_duration_hours,
                resilience_window_minutes=resilience_window_minutes,
                mission_enabled=mission_enabled,
                mission_target=mission_target,
                preparation_minutes=preparation_minutes,
                ics_url=ics_url,
                override_date=override_date,
                override_sleep_hour=override_sleep_hour,
                override_sleep_minute=override_sleep_minute,
                override_wake_hour=override_wake_hour,
                override_wake_minute=override_wake_minute,
            )
            self.db.add(row)
        else:
            row.wake_up_hour = wake_up_hour
            row.wake_up_minute = wake_up_minute
            row.sleep_duration_hours = sleep_duration_hours
            row.resilience_window_minutes = resilience_window_minutes
            row.mission_enabled = mission_enabled
            row.mission_target = mission_target
            row.preparation_minutes = preparation_minutes
            row.ics_url = ics_url
            row.override_date = override_date
            row.override_sleep_hour = override_sleep_hour
            row.override_sleep_minute = override_sleep_minute
            row.override_wake_hour = override_wake_hour
            row.override_wake_minute = override_wake_minute
        await self.db.flush()
        await self.db.refresh(row)
        return row
