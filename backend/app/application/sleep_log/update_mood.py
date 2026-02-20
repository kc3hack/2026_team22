"""睡眠ログ気分更新ユースケース"""

from fastapi import HTTPException

from app.domain.sleep_log.repositories import ISleepLogRepository, SleepLogRecord


class UpdateMoodUseCase:
    def __init__(self, repo: ISleepLogRepository):
        self._repo = repo

    async def execute(self, log_id: str, user_id: str, mood: int) -> SleepLogRecord:
        result = await self._repo.update_mood(log_id, user_id, mood)
        if result is None:
            raise HTTPException(status_code=404, detail="Sleep log not found")
        return result
