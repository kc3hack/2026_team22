"""設定 API の入出力スキーマ"""

from pydantic import BaseModel, Field


class TodayOverride(BaseModel):
    """今日だけの就寝・起床オーバーライド"""

    date: str = Field(..., description="有効日 YYYY-MM-DD")
    sleep_hour: int = Field(..., ge=0, le=23)
    sleep_minute: int = Field(..., ge=0, le=59)
    wake_hour: int = Field(..., ge=0, le=23)
    wake_minute: int = Field(..., ge=0, le=59)


class SettingsResponse(BaseModel):
    """GET /api/v1/settings のレスポンス"""

    wake_up_hour: int = Field(default=7, ge=0, le=23)
    wake_up_minute: int = Field(default=0, ge=0, le=59)
    sleep_duration_hours: int = Field(default=8, ge=1, le=24)
    resilience_window_minutes: int = Field(default=20, ge=0, le=120)
    mission_enabled: bool = False
    mission_target: str | None = None
    preparation_minutes: int = Field(default=30, ge=0, le=300)
    ics_url: str | None = None
    today_override: TodayOverride | None = None


class SettingsPutRequest(BaseModel):
    """PUT /api/v1/settings のリクエスト Body"""

    wake_up_hour: int = Field(default=7, ge=0, le=23)
    wake_up_minute: int = Field(default=0, ge=0, le=59)
    sleep_duration_hours: int = Field(default=8, ge=1, le=24)
    resilience_window_minutes: int = Field(default=20, ge=0, le=120)
    mission_enabled: bool = False
    mission_target: str | None = None
    preparation_minutes: int = Field(default=30, ge=0, le=300)
    ics_url: str | None = None
    today_override: TodayOverride | None = None
