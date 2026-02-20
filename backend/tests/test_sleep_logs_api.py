"""
睡眠ログ API の統合テスト
認証は conftest.py で TEST_USER_ID にオーバーライドされている。
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user import User
from tests.conftest import TEST_USER_ID


@pytest.fixture
async def ensure_test_user(db_session: AsyncSession):
    """TEST_USER_ID のユーザーが DB に存在することを保証する"""
    from sqlalchemy import select

    result = await db_session.execute(
        select(User).where(User.id == TEST_USER_ID)
    )
    if result.scalar_one_or_none() is None:
        user = User(
            id=TEST_USER_ID,
            email=f"test-{TEST_USER_ID[:8]}@example.com",
            name="Test User",
        )
        db_session.add(user)
        await db_session.commit()


@pytest.mark.asyncio
async def test_create_sleep_log(client: AsyncClient, ensure_test_user):
    """POST /api/v1/sleep-logs で睡眠ログを作成できる"""
    resp = await client.post(
        "/api/v1/sleep-logs",
        json={
            "date": "2026-02-20",
            "score": 85,
            "usage_penalty": 5,
            "environment_penalty": 3,
            "phase1_warning": False,
            "phase2_warning": True,
            "light_exceeded": False,
            "noise_exceeded": False,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user_id"] == TEST_USER_ID
    assert data["date"] == "2026-02-20"
    assert data["score"] == 85
    assert data["mood"] is None
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_get_sleep_logs(client: AsyncClient, ensure_test_user):
    """GET /api/v1/sleep-logs でログ一覧を取得できる"""
    for d in ["2026-02-19", "2026-02-20"]:
        await client.post(
            "/api/v1/sleep-logs",
            json={"date": d, "score": 70},
        )

    resp = await client.get(
        "/api/v1/sleep-logs",
        params={"limit": 7},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    # 日付降順
    dates = [log["date"] for log in data["logs"]]
    assert dates == sorted(dates, reverse=True)


@pytest.mark.asyncio
async def test_get_sleep_logs_with_limit(client: AsyncClient, ensure_test_user):
    """GET /api/v1/sleep-logs?limit=1 で件数制限できる"""
    for d in ["2026-02-18", "2026-02-17"]:
        await client.post(
            "/api/v1/sleep-logs",
            json={"date": d, "score": 60},
        )

    resp = await client.get(
        "/api/v1/sleep-logs",
        params={"limit": 1},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_update_mood(client: AsyncClient, ensure_test_user):
    """PATCH /api/v1/sleep-logs/:id で気分を更新できる"""
    create_resp = await client.post(
        "/api/v1/sleep-logs",
        json={"date": "2026-02-20", "score": 90},
    )
    log_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/api/v1/sleep-logs/{log_id}",
        json={"mood": 4},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["mood"] == 4


@pytest.mark.asyncio
async def test_update_mood_not_found(client: AsyncClient, ensure_test_user):
    """存在しないログの気分更新は 404"""
    resp = await client.patch(
        f"/api/v1/sleep-logs/{uuid.uuid4()}",
        json={"mood": 3},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_sleep_log_with_mood(client: AsyncClient, ensure_test_user):
    """mood 付きで睡眠ログを作成できる"""
    resp = await client.post(
        "/api/v1/sleep-logs",
        json={"date": "2026-02-20", "score": 75, "mood": 3},
    )
    assert resp.status_code == 201
    assert resp.json()["mood"] == 3


@pytest.mark.asyncio
async def test_create_sleep_log_validation_error(client: AsyncClient, ensure_test_user):
    """不正なスコアは 422"""
    resp = await client.post(
        "/api/v1/sleep-logs",
        json={"date": "2026-02-20", "score": 150},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_mood_validation_error(client: AsyncClient, ensure_test_user):
    """不正な mood 値は 422"""
    create_resp = await client.post(
        "/api/v1/sleep-logs",
        json={"date": "2026-02-20", "score": 80},
    )
    log_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/sleep-logs/{log_id}",
        json={"mood": 6},
    )
    assert resp.status_code == 422
