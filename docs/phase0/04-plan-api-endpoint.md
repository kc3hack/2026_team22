# 04: プラン取得 API エンドポイント

## 概要

朝・ホーム画面用に「カレンダー予定＋睡眠ログ＋設定」を送ると週間睡眠プランが返る API を追加する。

## 完了条件

- [ ] `POST /api/v1/plan` または `POST /api/v1/home/plan` が存在する（ルートは要相談）
- [ ] リクエスト body にカレンダー予定・睡眠ログ・設定を受け取る Pydantic スキーマがある
- [ ] 03 の UseCase を呼び出し、レスポンスで週間睡眠プラン（JSON）を返す
- [ ] 認証: 00 の `get_current_user`（または同等）で user_id を取得し、UseCase に渡す

## メモ

- 既存の `routers/users.py` と同様、Router は HTTP のみで UseCase に委譲する
- `main.py` にルーターを追加する
