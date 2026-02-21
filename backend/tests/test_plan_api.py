"""
POST /api/v1/sleep-plans の統合テスト（実 DB、LLM はモック）
todayOverride, force, cache_hit の E2E テスト含む。
"""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.main import web_app as app
from app.presentation.api.plan import get_plan_generator
from app.presentation.dependencies.auth import get_current_user_id


class TestPlanAPIAuth:
    """認証ミドルウェアの挙動（401）"""

    async def test_plan_returns_401_without_authorization(self, client: AsyncClient):
        """Authorization ヘッダーなしで POST /sleep-plans すると 401"""
        # このテストだけ認証オーバーライドを外す
        app.dependency_overrides.pop(get_current_user_id, None)
        try:
            res = await client.post(
                "/api/v1/sleep-plans",
                json={
                    "calendar_events": [],
                    "sleep_logs": [],
                    "settings": {},
                },
            )
            assert res.status_code == 401
        finally:
            app.dependency_overrides[get_current_user_id] = lambda: (
                "11111111-1111-1111-1111-111111111111"
            )


class TestPlanAPI:
    """プラン取得 API の E2E（DB 接続あり、OpenRouter はモック）"""

    @pytest.fixture
    def mock_llm_plan(self):
        return {
            "week_plan": [
                {
                    "day": "月曜",
                    "recommended_bedtime": "22:00",
                    "recommended_wakeup": "06:30",
                    "advice": "テスト",
                },
                {
                    "day": "火曜",
                    "recommended_bedtime": "22:00",
                    "recommended_wakeup": "06:30",
                    "advice": "テスト",
                },
            ]
        }

    @pytest.fixture
    def mock_plan_generator(self, mock_llm_plan):
        mock = AsyncMock()
        mock.generate_week_plan = AsyncMock(return_value=mock_llm_plan)
        return mock

    async def test_plan_returns_week_plan(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """ユーザー作成 → POST /sleep-plans で週間プランが返る（キャッシュミス・LLM モック）"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "PlanTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            # sleep_plan_cache の FK を満たすため、認証オーバーライドを作成ユーザー ID に
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {},
            }

            res = await client.post("/api/v1/sleep-plans", json=body)

            assert res.status_code == 200
            data = res.json()
            assert "week_plan" in data
            assert len(data["week_plan"]) == 2
            assert data["week_plan"][0]["day"] == "月曜"
            assert data["cache_hit"] is False
            mock_plan_generator.generate_week_plan.assert_called_once()
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)

    async def test_plan_cache_hit_same_body(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """同じ body で 2 回 POST すると 2 回目はキャッシュヒット（LLM は 1 回だけ）"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "PlanCacheTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body = {
                "calendar_events": [{"title": "会議"}],
                "sleep_logs": [],
                "settings": {},
            }

            res1 = await client.post("/api/v1/sleep-plans", json=body)
            res2 = await client.post("/api/v1/sleep-plans", json=body)

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert res1.json()["cache_hit"] is False
            assert res2.json()["cache_hit"] is True
            assert mock_plan_generator.generate_week_plan.call_count == 1
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)

    async def test_force_bypasses_cache(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """force=true で 2 回目もキャッシュを無視して LLM を呼ぶ"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "ForceTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {},
            }

            res1 = await client.post("/api/v1/sleep-plans", json=body)
            assert res1.status_code == 200

            res2 = await client.post("/api/v1/sleep-plans?force=true", json=body)
            assert res2.status_code == 200
            assert res2.json()["cache_hit"] is False
            assert mock_plan_generator.generate_week_plan.call_count == 2
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)

    async def test_today_override_in_settings_in_request(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """settings 内の today_override 付きリクエストが正常に受け付けられる"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "OverrideTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {
                    "wake_up_time": "07:00",
                    "sleep_duration_hours": 8,
                    "today_override": {
                        "date": "2026-02-20",
                        "sleepHour": 23,
                        "sleepMinute": 30,
                        "wakeHour": 7,
                        "wakeMinute": 0,
                    },
                },
            }

            res = await client.post("/api/v1/sleep-plans", json=body)
            assert res.status_code == 200
            data = res.json()
            assert "week_plan" in data
            assert data["cache_hit"] is False

            # LLM に settings（today_override 含む）が渡されていること
            settings = mock_plan_generator.generate_week_plan.call_args[0][2]
            assert settings.get("today_override") is not None
            assert settings["today_override"]["date"] == "2026-02-20"
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)

    async def test_today_date_in_request(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """today_date 付きリクエストが LLM に渡される"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "TodayDateTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {},
                "today_date": "2026-02-20",
            }

            res = await client.post("/api/v1/sleep-plans", json=body)
            assert res.status_code == 200

            call_kwargs = mock_plan_generator.generate_week_plan.call_args[1]
            assert call_kwargs["today_date"] == "2026-02-20"
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)

    async def test_today_override_in_settings_changes_cache_key(
        self,
        client: AsyncClient,
        unique_email: str,
        mock_llm_plan: dict,
        mock_plan_generator,
    ):
        """settings 内の today_override ありとなしで別キャッシュになる"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "OverrideCacheTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]
            app.dependency_overrides[get_current_user_id] = lambda: user_id

            body_no_override = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {},
            }
            body_with_override = {
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {
                    "wake_up_time": "07:00",
                    "sleep_duration_hours": 8,
                    "today_override": {
                        "date": "2026-02-20",
                        "sleepHour": 23,
                        "sleepMinute": 30,
                        "wakeHour": 7,
                        "wakeMinute": 0,
                    },
                },
            }

            res1 = await client.post("/api/v1/sleep-plans", json=body_no_override)
            res2 = await client.post("/api/v1/sleep-plans", json=body_with_override)

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert res1.json()["cache_hit"] is False
            assert res2.json()["cache_hit"] is False
            assert mock_plan_generator.generate_week_plan.call_count == 2
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)
