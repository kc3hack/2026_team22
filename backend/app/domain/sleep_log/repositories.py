"""
睡眠ログリポジトリのポート（インターフェース）
Infrastructure 層がこのインターフェースを実装する。
"""

from datetime import date, datetime
from typing import Protocol, Sequence


class SleepLogRecord(Protocol):
    """睡眠ログレコードのプロトコル"""

    id: str
    user_id: str
    date: date
    score: int
    scheduled_sleep_time: datetime | None
    usage_penalty: int
    environment_penalty: int
    phase1_warning: bool
    phase2_warning: bool
    light_exceeded: bool
    noise_exceeded: bool
    mood: int | None
    created_at: datetime


class ISleepLogRepository(Protocol):
    """睡眠ログのリポジトリポート"""

    async def get_by_user(
        self, user_id: str, limit: int = 7
    ) -> Sequence[SleepLogRecord]:
        """user_id のログを日付降順で取得"""
        ...

    async def get_by_id(self, log_id: str, user_id: str) -> SleepLogRecord | None:
        """id と user_id で 1 件取得"""
        ...

    async def create(
        self,
        user_id: str,
        log_date: date,
        score: int,
        scheduled_sleep_time: datetime | None = None,
        usage_penalty: int = 0,
        environment_penalty: int = 0,
        phase1_warning: bool = False,
        phase2_warning: bool = False,
        light_exceeded: bool = False,
        noise_exceeded: bool = False,
        mood: int | None = None,
    ) -> SleepLogRecord:
        """睡眠ログを新規作成"""
        ...

    async def update_mood(
        self, log_id: str, user_id: str, mood: int
    ) -> SleepLogRecord | None:
        """指定ログの気分を更新"""
        ...
