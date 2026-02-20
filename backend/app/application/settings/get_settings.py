"""
GetSettingsUseCase - 睡眠設定の取得
user_id に紐づく設定を返す。存在しなければ None を返し、呼び出し元でデフォルトを返す。
"""

from app.infrastructure.persistence.repositories.sleep_settings_repository import (
    SleepSettingsRepository,
)


class GetSettingsUseCase:
    """睡眠設定を取得する UseCase"""

    def __init__(self, settings_repo: SleepSettingsRepository):
        self.settings_repo = settings_repo

    async def execute(self, user_id: str):
        """user_id の設定を 1 件取得。無ければ None。"""
        return await self.settings_repo.get_by_user_id(user_id)
