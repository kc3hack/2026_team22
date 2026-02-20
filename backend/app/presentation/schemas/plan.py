"""プラン API の入出力スキーマ"""

from typing import Any

from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    """週間プラン取得リクエスト"""

    user_id: str = Field(
        ..., description="ユーザーID（認証済みの user_id を渡す）"
    )
    calendar_events: list[dict[str, Any]] = Field(
        default_factory=list, description="カレンダー予定のリスト"
    )
    sleep_logs: list[dict[str, Any]] = Field(
        default_factory=list, description="睡眠ログのリスト"
    )
    settings: dict[str, Any] = Field(
        default_factory=dict, description="睡眠関連設定"
    )
