"""プラン API の入出力スキーマ"""

from typing import Any

from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    """週間プラン取得リクエスト（user_id は認証トークンから注入されるため不要）

    settings には wake_up_time, sleep_duration_hours に加え、
    today_override（今日だけの就寝・起床オーバーライド、任意）を含める。
    """

    calendar_events: list[dict[str, Any]] = Field(
        default_factory=list, description="カレンダー予定のリスト"
    )
    sleep_logs: list[dict[str, Any]] = Field(default_factory=list, description="睡眠ログのリスト")
    settings: dict[str, Any] = Field(
        default_factory=dict,
        description="睡眠関連設定（wake_up_time, sleep_duration_hours, today_override 等）",
    )
    today_date: str | None = Field(
        default=None,
        description="今日の日付 YYYY-MM-DD（署名・プロンプト用。未指定時はサーバー日付を使用）",
    )
