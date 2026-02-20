"""
認証依存性: Authorization Bearer トークンを検証し user_id を注入する。
未認証の場合は 401 Unauthorized を返す。
"""

from fastapi import Depends, HTTPException, Request

from app.infrastructure.auth import verify_supabase_jwt


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
