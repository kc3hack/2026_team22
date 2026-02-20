"""睡眠ログ API（認証必須: user_id はトークンから注入）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.sleep_log import (
    CreateSleepLogUseCase,
    GetSleepLogsUseCase,
    UpdateMoodUseCase,
)
from app.application.sleep_log.create_sleep_log import CreateSleepLogInput
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.sleep_log_repository import (
    SleepLogRepository,
)
from app.presentation.dependencies.auth import ensure_current_user
from app.presentation.schemas.sleep_log import (
    SleepLogCreate,
    SleepLogListResponse,
    SleepLogMoodUpdate,
    SleepLogResponse,
)

router = APIRouter(prefix="/sleep-logs", tags=["sleep-logs"])


def get_sleep_log_repository(
    db: AsyncSession = Depends(get_db),
) -> SleepLogRepository:
    return SleepLogRepository(db)


@router.get("", response_model=SleepLogListResponse)
async def get_sleep_logs(
    user_id: str = Depends(ensure_current_user),
    limit: int = Query(7, ge=1, le=100, description="取得件数"),
    repo: SleepLogRepository = Depends(get_sleep_log_repository),
):
    """睡眠ログ一覧を取得する（日付降順）。認証必須。"""
    usecase = GetSleepLogsUseCase(repo)
    logs = await usecase.execute(user_id, limit)
    return SleepLogListResponse(logs=logs, total=len(logs))


@router.post("", response_model=SleepLogResponse, status_code=201)
async def create_sleep_log(
    body: SleepLogCreate,
    user_id: str = Depends(ensure_current_user),
    repo: SleepLogRepository = Depends(get_sleep_log_repository),
):
    """睡眠ログを新規作成する。認証必須。"""
    usecase = CreateSleepLogUseCase(repo)
    input_data = CreateSleepLogInput(
        user_id=user_id,
        date=body.date,
        score=body.score,
        scheduled_sleep_time=body.scheduled_sleep_time,
        usage_penalty=body.usage_penalty,
        environment_penalty=body.environment_penalty,
        phase1_warning=body.phase1_warning,
        phase2_warning=body.phase2_warning,
        light_exceeded=body.light_exceeded,
        noise_exceeded=body.noise_exceeded,
        mood=body.mood,
    )
    log = await usecase.execute(input_data)
    return log


@router.patch("/{log_id}", response_model=SleepLogResponse)
async def update_sleep_log_mood(
    log_id: str,
    body: SleepLogMoodUpdate,
    user_id: str = Depends(ensure_current_user),
    repo: SleepLogRepository = Depends(get_sleep_log_repository),
):
    """睡眠ログの気分を更新する（朝の振り返り用）。認証必須。"""
    usecase = UpdateMoodUseCase(repo)
    log = await usecase.execute(log_id, user_id, body.mood)
    return log
