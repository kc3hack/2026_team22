# 03: プラン取得 UseCase

## 概要

「カレンダー予定＋睡眠ログ＋設定」を受け取り、キャッシュヒットなら保存済みプランを返し、キャッシュミスなら OpenRouter で週間睡眠プランを生成して DB に保存し返す。

## 完了条件

- [ ] `GetOrCreatePlanUseCase`（または同等）が存在する
- [ ] 入力: カレンダー予定・睡眠ログ・設定（と user_id）
- [ ] 02 のハッシュで DB を検索し、同一 hash のプランがあればそれを返す（Cache Hit）
- [ ] なければ OpenRouter（`app.services.llm.openrouter_client`）を呼び出し、Temperature=0 で週間睡眠プラン JSON を取得
- [ ] 取得したプランとハッシュを 01 のキャッシュテーブルに保存し、プランを返す（Cache Miss）
- [ ] リポジトリ層でキャッシュの取得・保存を行う

## メモ

- LLM へのプロンプト内容・返却 JSON スキーマは別途決める（このチケット内で簡易スキーマでよい）
- 既存の `BaseUseCase` パターンに沿う
