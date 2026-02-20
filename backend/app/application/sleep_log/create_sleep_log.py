"""睡眠ログ作成ユースケース"""

from dataclasses import dataclass
from datetime import date, datetime

from app.domain.sleep_log.repositories import ISleepLogRepository, SleepLogRecord


@dataclass
class CreateSleepLogInput:
    user_id: str
    date: date
    score: int
    scheduled_sleep_time: datetime | None = None
    usage_penalty: int = 0
    environment_penalty: int = 0
    phase1_warning: bool = False
    phase2_warning: bool = False
    light_exceeded: bool = False
    noise_exceeded: bool = False
    mood: int | None = None


class CreateSleepLogUseCase:
    def __init__(self, repo: ISleepLogRepository):
        self._repo = repo

    async def execute(self, input: CreateSleepLogInput) -> SleepLogRecord:
        return await self._repo.create(
            user_id=input.user_id,
            log_date=input.date,
            score=input.score,
            scheduled_sleep_time=input.scheduled_sleep_time,
            usage_penalty=input.usage_penalty,
            environment_penalty=input.environment_penalty,
            phase1_warning=input.phase1_warning,
            phase2_warning=input.phase2_warning,
            light_exceeded=input.light_exceeded,
            noise_exceeded=input.noise_exceeded,
            mood=input.mood,
        )
