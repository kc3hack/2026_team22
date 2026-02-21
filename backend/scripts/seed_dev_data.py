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

            # 過去6日分の日付（今日の2日前から7日間＝就寝日。起床日表示なら昨日〜6日前）
            # 昨日を含めない → 登録テスト時は Home の「登録テスト用」ボタンで仮データをセット
            today = date.today()
            dates = [today - timedelta(days=i) for i in range(2, 8)]

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

            # バリエーションのあるテストデータ（UI確認用）
            # 各日: (score, usage_penalty, usage_minutes, environment_penalty,
            #        phase1_warning, phase2_warning, light_exceeded, noise_exceeded, mood)
            # 就寝日 = today-2〜today-7 → 起床日表示なら昨日〜6日前
            samples = [
                (95, 0, 5, 0, False, False, False, False, 5),   # 就寝 today-2: 良好
                (75, 20, 22, 0, True, False, False, False, 4),  # 就寝 today-3: スマホ22分→減点
                (55, 60, 38, 0, True, True, False, False, 2),   # 就寝 today-4: スマホ38分→大減点
                (100, 0, 0, 0, False, False, False, False, 5),  # 就寝 today-5: 完璧
                (85, 0, 8, 5, False, False, True, False, 4),    # 就寝 today-6: 光オーバー
                (70, 20, 25, 5, True, False, True, False, 3),   # 就寝 today-7: スマホ+環境
            ]
            rows = []
            for i, d in enumerate(to_insert):
                s = samples[i % len(samples)]
                rows.append((
                    str(uuid.uuid4()),
                    user_id,
                    d,
                    s[0],
                    None,
                    s[1],
                    s[2],
                    s[3],
                    s[4],
                    s[5],
                    s[6],
                    s[7],
                    s[8],
                ))

            execute_values(
                cur,
                """
                INSERT INTO sleep_logs (
                    id, user_id, date, score, scheduled_sleep_time,
                    usage_penalty, usage_minutes, environment_penalty,
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
