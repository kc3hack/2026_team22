"""
PutSettingsUseCase - 睡眠設定の保存（upsert）
"""

from datetime import date

from app.infrastructure.persistence.repositories.sleep_settings_repository import (
    SleepSettingsRepository,
)


class PutSettingsUseCase:
    """睡眠設定を保存する UseCase（1 ユーザー 1 行で upsert）"""

    def __init__(self, settings_repo: SleepSettingsRepository):
        self.settings_repo = settings_repo

    async def execute(self, user_id: str, payload: "PutSettingsPayload") -> "SleepSettings":
        """設定を upsert して保存済みエンティティを返す。"""
        from app.infrastructure.persistence.models.sleep_settings import SleepSettings

        override_date = None
        override_sleep_hour = None
        override_sleep_minute = None
        override_wake_hour = None
        override_wake_minute = None
        if payload.today_override is not None:
            override_date = (
                date.fromisoformat(payload.today_override.date)
                if isinstance(payload.today_override.date, str)
                else payload.today_override.date
            )
            override_sleep_hour = payload.today_override.sleep_hour
            override_sleep_minute = payload.today_override.sleep_minute
            override_wake_hour = payload.today_override.wake_hour
            override_wake_minute = payload.today_override.wake_minute

        row = await self.settings_repo.upsert(
            user_id,
            wake_up_hour=payload.wake_up_hour,
            wake_up_minute=payload.wake_up_minute,
            sleep_duration_hours=payload.sleep_duration_hours,
            resilience_window_minutes=payload.resilience_window_minutes,
            mission_enabled=payload.mission_enabled,
            mission_target=payload.mission_target,
            preparation_minutes=payload.preparation_minutes,
            ics_url=payload.ics_url,
            override_date=override_date,
            override_sleep_hour=override_sleep_hour,
            override_sleep_minute=override_sleep_minute,
            override_wake_hour=override_wake_hour,
            override_wake_minute=override_wake_minute,
        )
        return row


class PutSettingsPayload:
    """PUT 設定の入力"""

    def __init__(
        self,
        wake_up_hour: int = 7,
        wake_up_minute: int = 0,
        sleep_duration_hours: int = 8,
        resilience_window_minutes: int = 20,
        mission_enabled: bool = False,
        mission_target: str | None = None,
        preparation_minutes: int = 30,
        ics_url: str | None = None,
        today_override: "TodayOverrideInput | None" = None,
    ):
        self.wake_up_hour = wake_up_hour
        self.wake_up_minute = wake_up_minute
        self.sleep_duration_hours = sleep_duration_hours
        self.resilience_window_minutes = resilience_window_minutes
        self.mission_enabled = mission_enabled
        self.mission_target = mission_target
        self.preparation_minutes = preparation_minutes
        self.ics_url = ics_url
        self.today_override = today_override


class TodayOverrideInput:
    """今日のオーバーライド入力"""

    def __init__(
        self,
        date: str,
        sleep_hour: int,
        sleep_minute: int,
        wake_hour: int,
        wake_minute: int,
    ):
        self.date = date
        self.sleep_hour = sleep_hour
        self.sleep_minute = sleep_minute
        self.wake_hour = wake_hour
        self.wake_minute = wake_minute
