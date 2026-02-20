"""
Plan ユースケースのポート（外部サービスインターフェース）
Infrastructure 層の LLM クライアントが実装する。
"""

from typing import Any, Protocol


class IPlanGenerator(Protocol):
    """週間睡眠プランを生成するポート（LLM 等）"""

    async def generate_week_plan(
        self,
        calendar_events: list[Any],
        sleep_logs: list[Any],
        settings: dict[str, Any],
        today_override: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """カレンダー・睡眠ログ・設定・todayOverride から週間プラン JSON を生成する"""
        ...
