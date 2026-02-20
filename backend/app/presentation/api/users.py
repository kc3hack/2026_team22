"""Users API"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.user import (
    CreateUserUseCase,
    DeleteUserUseCase,
    GetAllUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
)
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.user_repository import (
    UserRepository,
)
from app.presentation.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


def get_user_repository(
    db: AsyncSession = Depends(get_db),
) -> UserRepository:
    return UserRepository(db)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを作成"""
    usecase = CreateUserUseCase(user_repo)
    user = await usecase.execute({"email": data.email, "name": data.name})
    return user


@router.get("", response_model=UserListResponse)
async def get_users(
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザー一覧を取得"""
    usecase = GetAllUsersUseCase(user_repo)
    users = await usecase.execute()
    return UserListResponse(users=list(users), total=len(users))


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
    update_data = {"name": data.name}
    user = await usecase.execute((user_id, update_data))
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    user_repo: UserRepository = Depends(get_user_repository),
):
    """ユーザーを削除"""
    usecase = DeleteUserUseCase(user_repo)
    await usecase.execute(user_id)
