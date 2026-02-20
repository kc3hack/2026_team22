#!/usr/bin/env uv run
"""
開発用シード: SEED_USER_ID の users 行を upsert し、過去6日分の睡眠ログを挿入する。
呼び出し元: scripts/seed-dev-user.mjs（DATABASE_URL, SEED_USER_ID, SEED_EMAIL, SEED_NAME を渡す）
"""
from __future__ import annotations

import os
import uuid
from datetime import date, timedelta

import psycopg2
from psycopg2.extras import execute_values

def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    user_id = os.environ.get("SEED_USER_ID")
    email = os.environ.get("SEED_EMAIL", "example@example.com")
    name = os.environ.get("SEED_NAME", "テストユーザー")

    if not database_url or not user_id:
        raise SystemExit("DATABASE_URL と SEED_USER_ID を設定してください。")

    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            # users: upsert（id が Supabase Auth の uid と一致）
            cur.execute(
                """
                INSERT INTO users (id, email, name, created_at, updated_at)
                VALUES (%s, %s, %s, now(), now())
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    updated_at = now()
                """,
                (user_id, email, name),
            )

            # 過去6日分の日付（今日の前日から6日間）
            today = date.today()
            dates = [today - timedelta(days=i) for i in range(1, 7)]

            # 既存の (user_id, date) がある日はスキップ
            cur.execute(
                "SELECT date FROM sleep_logs WHERE user_id = %s AND date = ANY(%s)",
                (user_id, dates),
            )
            existing_dates = {row[0] for row in cur.fetchall()}
            to_insert = [d for d in dates if d not in existing_dates]

            if not to_insert:
                print("睡眠ログは既に登録済みのためスキップしました。")
                conn.commit()
                return

            # スコアは 70〜90 でばらつかせる
            rows = [
                (
                    str(uuid.uuid4()),
                    user_id,
                    d,
                    70 + (abs(hash(d.isoformat())) % 21),
                    None,
                    0,
                    0,
                    False,
                    False,
                    False,
                    False,
                    None,
                )
                for d in to_insert
            ]

            execute_values(
                cur,
                """
                INSERT INTO sleep_logs (
                    id, user_id, date, score, scheduled_sleep_time,
                    usage_penalty, environment_penalty,
                    phase1_warning, phase2_warning, light_exceeded, noise_exceeded, mood
                ) VALUES %s
                """,
                rows,
            )

        conn.commit()
        print(f"users を upsert し、睡眠ログ {len(to_insert)} 件を登録しました。")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
