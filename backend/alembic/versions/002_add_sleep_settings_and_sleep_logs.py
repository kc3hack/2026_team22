"""add sleep_settings and sleep_logs tables

Revision ID: 002
Revises: 001
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sleep_settings",
        sa.Column("user_id", sa.String(36), primary_key=True),
        sa.Column("wake_up_hour", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("wake_up_minute", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sleep_duration_hours", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("resilience_window_minutes", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("mission_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("mission_target", sa.String(255), nullable=True),
        sa.Column("preparation_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("ics_url", sa.String(2048), nullable=True),
        sa.Column("override_date", sa.Date(), nullable=True),
        sa.Column("override_sleep_hour", sa.Integer(), nullable=True),
        sa.Column("override_sleep_minute", sa.Integer(), nullable=True),
        sa.Column("override_wake_hour", sa.Integer(), nullable=True),
        sa.Column("override_wake_minute", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "sleep_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("scheduled_sleep_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("usage_penalty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("environment_penalty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("phase1_warning", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("phase2_warning", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("light_exceeded", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("noise_exceeded", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("mood", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_sleep_logs_user_id", "sleep_logs", ["user_id"])
    op.create_index("ix_sleep_logs_user_id_date", "sleep_logs", ["user_id", "date"])


def downgrade() -> None:
    op.drop_index("ix_sleep_logs_user_id_date", table_name="sleep_logs")
    op.drop_index("ix_sleep_logs_user_id", table_name="sleep_logs")
    op.drop_table("sleep_logs")
    op.drop_table("sleep_settings")
