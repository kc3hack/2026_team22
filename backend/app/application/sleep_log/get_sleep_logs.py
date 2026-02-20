"""睡眠ログ一覧取得ユースケース"""

from app.domain.sleep_log.repositories import ISleepLogRepository, SleepLogRecord


class GetSleepLogsUseCase:
    def __init__(self, repo: ISleepLogRepository):
        self._repo = repo

    async def execute(self, user_id: str, limit: int = 7) -> list[SleepLogRecord]:
        return list(await self._repo.get_by_user(user_id, limit))
