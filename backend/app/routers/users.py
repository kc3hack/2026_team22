"""
Usersルーター（サンプル）
Router層はHTTPのハンドリングのみ、ロジックはUseCaseに委譲
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.repositories.user_repository import UserRepository
from app.usecases.user import (
    CreateUserUseCase,
    GetUserUseCase,
    GetAllUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
)

router = APIRouter(prefix="/users", tags=["users"])


# === Dependency Injection ===

def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


# === Endpoints ===

@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを作成"""
    usecase = CreateUserUseCase(user_repo)
    user = await usecase.execute(data)
    return user


@router.get("", response_model=UserListResponse)
async def get_users(
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザー一覧を取得"""
    usecase = GetAllUsersUseCase(user_repo)
    users = await usecase.execute()
    return UserListResponse(users=users, total=len(users))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを取得"""
    usecase = GetUserUseCase(user_repo)
    user = await usecase.execute(user_id)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを更新"""
    usecase = UpdateUserUseCase(user_repo)
    user = await usecase.execute((user_id, data))
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを削除"""
    usecase = DeleteUserUseCase(user_repo)
    await usecase.execute(user_id)
