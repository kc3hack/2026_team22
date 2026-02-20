"""
認証依存性: Authorization Bearer トークンを検証し user_id を注入する。
未認証の場合は 401 Unauthorized を返す。
ensure_current_user は user_id に紐づく users 行が存在することを保証する（FK エラー防止）。
"""

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.auth import verify_supabase_jwt
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.user_repository import UserRepository


def get_current_user_id(request: Request) -> str:
    """
    リクエストの Authorization: Bearer <token> を検証し、認証済み user_id を返す。
    トークンが無い・無効・期限切れの場合は 401 を返す。
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header (expected: Bearer <token>)",
        )

    token = auth_header[7:].strip()  # "Bearer " の後ろ
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        user_id = verify_supabase_jwt(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_id


async def ensure_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    認証済み user_id を返し、かつ users テーブルに該当行が存在することを保証する。
    sleep_plan_cache / sleep_settings / sleep_logs 等の FK 制約違反を防ぐため、
    初回利用時に id=user_id の行を自動作成する。
    """
    repo = UserRepository(db)
    await repo.ensure_user_exists(user_id)
    return user_id
