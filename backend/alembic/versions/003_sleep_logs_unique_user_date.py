"""sleep_logs: 1日1ログ制約 (user_id, date) unique

Revision ID: 003
Revises: 002
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_sleep_logs_user_id_date",
        "sleep_logs",
        ["user_id", "date"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_sleep_logs_user_id_date",
        "sleep_logs",
        type_="unique",
    )
