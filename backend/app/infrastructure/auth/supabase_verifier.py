"""
Supabase JWT 検証: アクセストークンから user_id を取得する。
"""

import logging

from supabase import create_client

from app.config import settings

logger = logging.getLogger(__name__)


def verify_supabase_jwt(access_token: str) -> str:
    """
    Supabase のアクセストークン（JWT）を検証し、認証済みユーザーの user_id を返す。

    Args:
        access_token: Authorization: Bearer で送られてきた JWT 文字列。

    Returns:
        認証済みユーザーの user_id（UUID 文字列）。

    Raises:
        ValueError: トークンが無い・無効・期限切れ、または Supabase 未設定の場合。
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Supabase is not configured (SUPABASE_URL / SUPABASE_ANON_KEY)")

    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
        response = client.auth.get_user(jwt=access_token)
    except Exception as e:
        # 実機 401 切り分け: 接続失敗かトークン無効かログで判別する
        logger.warning(
            "Supabase JWT verification failed: %s (SUPABASE_URL=%s)",
            e,
            (settings.SUPABASE_URL or "")[:50],
        )
        raise ValueError("Invalid or expired token") from e

    if response is None or not getattr(response, "user", None):
        raise ValueError("Invalid or expired token")

    user_id = response.user.id
    if not user_id:
        raise ValueError("User ID not found in token")

    return str(user_id)
