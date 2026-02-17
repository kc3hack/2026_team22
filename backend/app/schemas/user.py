"""
Userスキーマ（入出力DTO）
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr


# === Input (リクエスト) ===

class UserCreate(BaseModel):
    """ユーザー作成リクエスト"""
    email: EmailStr
    name: str


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト"""
    name: str | None = None


# === Output (レスポンス) ===

class UserResponse(BaseModel):
    """ユーザーレスポンス"""
    id: str
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """ユーザー一覧レスポンス"""
    users: list[UserResponse]
    total: int
