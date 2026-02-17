# 00: 認証機能

## 概要

プラン API は「誰の」キャッシュかで user_id を識別する必要がある。そのため、バックエンドで「ログイン済みユーザー」を判定し、フロントでは API 呼び出し時に認証情報を付与できるようにする。

## 完了条件

### バックエンド

- [ ] 認証用のエンドポイントまたは Supabase Auth 連携がある（例: ログインでトークン発行、または Supabase の JWT を検証）
- [ ] リクエストから「現在の user_id」を取得する Dependency がある（例: `get_current_user`。Authorization ヘッダーのトークン検証 → user_id）
- [ ] 保護したいルート（例: プラン取得 API）でこの Dependency を利用できる

### フロント

- [ ] ログイン成功時にトークン（またはセッション情報）を取得・保存している（authStore または SecureStore 等）
- [ ] ログアウト時にトークンを破棄している
- [ ] バックエンド API 呼び出し時に、認証情報（Authorization ヘッダー等）を付与できる（共通クライアント or 各 API で付与）

## メモ

- 既存の `authStore`（user, isAuthenticated）と `LoginScreen`（TODO のまま）を、実際の認証フロー・トークン保持に繋げる
- Supabase を使う場合は、バックエンドで Supabase の JWT を検証して user_id を取得する形にするとよい
- 暫定で「リクエスト body に user_id を入れる」でも動くが、本チケット完了で「トークンから user_id を取る」形にするとセキュアになる
