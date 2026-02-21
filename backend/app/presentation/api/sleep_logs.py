"""睡眠ログ API（認証必須: user_id はトークンから注入）"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.sleep_log import CreateSleepLogUseCase, GetSleepLogsUseCase
from app.application.sleep_log.create_sleep_log import CreateSleepLogInput
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.sleep_log_repository import (
    SleepLogRepository,
)
from app.presentation.dependencies.auth import ensure_current_user
from app.presentation.schemas.sleep_log import (
    SleepLogCreate,
    SleepLogListResponse,
    SleepLogResponse,
    SleepLogUpdate,
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
    return SleepLogListResponse(
        logs=[SleepLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )


@router.post("", response_model=SleepLogResponse, status_code=201)
async def create_sleep_log(
    body: SleepLogCreate,
    user_id: str = Depends(ensure_current_user),
    repo: SleepLogRepository = Depends(get_sleep_log_repository),
):
    """睡眠ログを新規作成する。同一 user・同一 date は 1 件のみ（409）。認証必須。"""
    existing = await repo.get_by_user_and_date(user_id, body.date)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Sleep log already exists for date {body.date}",
        )
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
async def update_sleep_log(
    log_id: str,
    body: SleepLogUpdate,
    user_id: str = Depends(ensure_current_user),
    repo: SleepLogRepository = Depends(get_sleep_log_repository),
):
    """睡眠ログを部分更新する（日付・スコア・ペナルティ・気分など。指定したフィールドのみ更新）。認証必須。"""
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=422, detail="At least one field required")
    if "date" in payload:
        other = await repo.get_by_user_and_date(user_id, payload["date"])
        if other is not None and other.id != log_id:
            raise HTTPException(
                status_code=409,
                detail=f"Sleep log already exists for date {payload['date']}",
            )
    log = await repo.update(log_id, user_id, **payload)
    if log is None:
        raise HTTPException(status_code=404, detail="Sleep log not found")
    return log
