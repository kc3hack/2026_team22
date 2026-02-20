"""
POST /api/v1/plan の統合テスト（実 DB、LLM はモック）
"""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.main import app
from app.presentation.api.plan import get_plan_generator


class TestPlanAPI:
    """プラン取得 API の E2E（DB 接続あり、OpenRouter はモック）"""

    @pytest.fixture
    def mock_llm_plan(self):
        return {
            "week_plan": [
                {"day": "月曜", "recommended_bedtime": "22:00", "recommended_wakeup": "06:30", "advice": "テスト"},
                {"day": "火曜", "recommended_bedtime": "22:00", "recommended_wakeup": "06:30", "advice": "テスト"},
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
        """ユーザー作成 → POST /plan で週間プランが返る（キャッシュミス・LLM モック）"""
        app.dependency_overrides[get_plan_generator] = lambda: mock_plan_generator

        try:
            create_res = await client.post(
                "/api/v1/users",
                json={"email": unique_email, "name": "PlanTest"},
            )
            assert create_res.status_code == 201
            user_id = create_res.json()["id"]

            body = {
                "user_id": user_id,
                "calendar_events": [],
                "sleep_logs": [],
                "settings": {},
            }

            res = await client.post("/api/v1/plan", json=body)

            assert res.status_code == 200
            data = res.json()
            assert "week_plan" in data
            assert len(data["week_plan"]) == 2
            assert data["week_plan"][0]["day"] == "月曜"
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

            body = {
                "user_id": user_id,
                "calendar_events": [{"title": "会議"}],
                "sleep_logs": [],
                "settings": {},
            }

            res1 = await client.post("/api/v1/plan", json=body)
            res2 = await client.post("/api/v1/plan", json=body)

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert res1.json() == res2.json()
            assert mock_plan_generator.generate_week_plan.call_count == 1
        finally:
            app.dependency_overrides.pop(get_plan_generator, None)
