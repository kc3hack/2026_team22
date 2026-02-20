"""設定 API（GET / PUT）。認証必須。"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.settings import GetSettingsUseCase, PutSettingsUseCase
from app.infrastructure.persistence.database import get_db
from app.application.settings.put_settings import PutSettingsPayload, TodayOverrideInput
from app.infrastructure.persistence.repositories.sleep_settings_repository import (
    SleepSettingsRepository,
)
from app.presentation.dependencies.auth import get_current_user_id
from app.presentation.schemas.settings import (
    SettingsPutRequest,
    SettingsResponse,
    TodayOverride,
)

router = APIRouter(prefix="/settings", tags=["settings"])


def _settings_repo(db: AsyncSession = Depends(get_db)) -> SleepSettingsRepository:
    return SleepSettingsRepository(db)


def _orm_to_response(row) -> SettingsResponse:
    """SleepSettings ORM を SettingsResponse に変換する。"""
    today_override = None
    if (
        row.override_date is not None
        and row.override_sleep_hour is not None
        and row.override_wake_hour is not None
    ):
        today_override = TodayOverride(
            date=row.override_date.isoformat(),
            sleep_hour=row.override_sleep_hour,
            sleep_minute=row.override_sleep_minute or 0,
            wake_hour=row.override_wake_hour,
            wake_minute=row.override_wake_minute or 0,
        )
    return SettingsResponse(
        wake_up_hour=row.wake_up_hour,
        wake_up_minute=row.wake_up_minute,
        sleep_duration_hours=row.sleep_duration_hours,
        resilience_window_minutes=row.resilience_window_minutes,
        mission_enabled=row.mission_enabled,
        mission_target=row.mission_target,
        preparation_minutes=row.preparation_minutes,
        ics_url=row.ics_url,
        today_override=today_override,
    )


def _default_response() -> SettingsResponse:
    """レコードが無いときのデフォルト設定レスポンス。"""
    return SettingsResponse()


@router.get("", response_model=SettingsResponse)
async def get_settings(
    user_id: str = Depends(get_current_user_id),
    repo: SleepSettingsRepository = Depends(_settings_repo),
):
    """
    睡眠設定を取得する。
    未保存の場合はデフォルト値を返す。認証必須。
    """
    usecase = GetSettingsUseCase(repo)
    row = await usecase.execute(user_id)
    if row is None:
        return _default_response()
    return _orm_to_response(row)


@router.put("", response_model=SettingsResponse)
async def put_settings(
    body: SettingsPutRequest,
    user_id: str = Depends(get_current_user_id),
    repo: SleepSettingsRepository = Depends(_settings_repo),
):
    """
    睡眠設定を保存する（upsert）。
    起床・睡眠時間, ics_url, レジリエンス, ミッション, 準備時間, todayOverride 等。
    認証必須。
    """
    today_override_input = None
    if body.today_override is not None:
        today_override_input = TodayOverrideInput(
            date=body.today_override.date,
            sleep_hour=body.today_override.sleep_hour,
            sleep_minute=body.today_override.sleep_minute,
            wake_hour=body.today_override.wake_hour,
            wake_minute=body.today_override.wake_minute,
        )
    payload = PutSettingsPayload(
        wake_up_hour=body.wake_up_hour,
        wake_up_minute=body.wake_up_minute,
        sleep_duration_hours=body.sleep_duration_hours,
        resilience_window_minutes=body.resilience_window_minutes,
        mission_enabled=body.mission_enabled,
        mission_target=body.mission_target,
        preparation_minutes=body.preparation_minutes,
        ics_url=body.ics_url,
        today_override=today_override_input,
    )
    usecase = PutSettingsUseCase(repo)
    row = await usecase.execute(user_id, payload)
    return _orm_to_response(row)
