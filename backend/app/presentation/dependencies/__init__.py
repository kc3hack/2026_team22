"""FastAPI 依存性（認証など）"""

from app.presentation.dependencies.auth import get_current_user_id

__all__ = ["get_current_user_id"]
