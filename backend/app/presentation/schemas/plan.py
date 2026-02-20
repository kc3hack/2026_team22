"""プラン API の入出力スキーマ"""

from typing import Any

from pydantic import BaseModel, Field


class TodayOverride(BaseModel):
    """今日だけの就寝・起床オーバーライド"""

    date: str = Field(..., description="有効日 YYYY-MM-DD")
    sleepHour: int = Field(..., description="就寝時 (0-23)")
    sleepMinute: int = Field(..., description="就寝分 (0-59)")
    wakeHour: int = Field(..., description="起床時 (0-23)")
    wakeMinute: int = Field(..., description="起床分 (0-59)")


class PlanRequest(BaseModel):
    """週間プラン取得リクエスト（user_id は認証トークンから注入されるため不要）"""

    calendar_events: list[dict[str, Any]] = Field(
        default_factory=list, description="カレンダー予定のリスト"
    )
    sleep_logs: list[dict[str, Any]] = Field(default_factory=list, description="睡眠ログのリスト")
    settings: dict[str, Any] = Field(default_factory=dict, description="睡眠関連設定")
    today_override: TodayOverride | None = Field(
        default=None, description="今日だけの就寝・起床オーバーライド（null 可）"
    )
