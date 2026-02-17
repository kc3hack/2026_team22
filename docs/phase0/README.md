# Phase 0: 朝・ホーム画面表示フロー（キャッシュ付き）

アーキテクチャ図「朝のホーム画面表示フロー」を実装するためのチケット一覧。

参照: [architecture-diagram.md](../architecture-diagram.md)

---

## チケット一覧

| # | チケット | 概要 | 担当 |
|---|----------|------|------|
| 00 | [認証機能](./00-auth.md) | ログイン・トークン検証・API 呼び出し時の認証付与 | Backend / Frontend |
| 01 | [プランキャッシュ用モデル](./01-plan-cache-model.md) | DB にキャッシュテーブルを追加 | Backend |
| 02 | [署名ハッシュ生成](./02-signature-hash.md) | 入力（カレンダー＋睡眠ログ＋設定）の Signature 生成 | Backend |
| 03 | [プラン取得 UseCase](./03-plan-usecase.md) | キャッシュ参照 or OpenRouter でプラン生成 | Backend |
| 04 | [プラン取得 API エンドポイント](./04-plan-api-endpoint.md) | Router・Schema・エンドポイント | Backend |
| 05 | [フロント: プラン API クライアント](./05-frontend-plan-client.md) | 型定義と API 呼び出し | Frontend |
| 06 | [フロント: ホーム画面でプラン表示](./06-frontend-home-plan-display.md) | ホームで API 呼び出し・表示 | Frontend |

---

## 依存関係

```
00（認証）
 │
 ├─→ 01, 02（並行可能）
 │        ↓
 │   03 → 04（04 は 00 の get_current_user を使用）
 │              ↓
 │   05 → 06（05 は 04 のスキーマ確定後。API 呼び出し時に 00 のトークン付与）
```

- **00** は 04 より前に完了していること（プラン API で user_id をトークンから取得するため）
- 05・06 では、API 呼び出し時に 00 で用意した認証情報を付与する
