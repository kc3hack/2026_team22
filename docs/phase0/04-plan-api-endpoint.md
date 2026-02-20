# 04: プラン取得 API エンドポイント

## 概要

朝・ホーム画面用に「カレンダー予定＋睡眠ログ＋設定」を送ると週間睡眠プランが返る API を追加する。

## 完了条件

- [x] `POST /api/v1/plan` が存在する
- [x] リクエスト body にカレンダー予定・睡眠ログ・設定を受け取る Pydantic スキーマ（`PlanRequest`）がある
- [x] 03 の UseCase を呼び出し、レスポンスで週間睡眠プラン（JSON）を返す
- [x] リクエスト body の `user_id` を UseCase に渡す（認証はクライアントで Supabase Auth 等から取得した user_id を渡す想定）

## メモ

- 既存の `routers/users.py` と同様、Router は HTTP のみで UseCase に委譲する
- `main.py` にルーターを追加する
