"""initial: users と sleep_plan_cache テーブル

Revision ID: 001
Revises:
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "sleep_plan_cache",
        sa.Column("user_id", sa.String(36), primary_key=True),
        sa.Column("signature_hash", sa.String(64), nullable=False),
        sa.Column("plan_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_sleep_plan_cache_signature_hash", "sleep_plan_cache", ["signature_hash"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_sleep_plan_cache_signature_hash", table_name="sleep_plan_cache")
    op.drop_table("sleep_plan_cache")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
