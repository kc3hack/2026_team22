# AI用プロジェクトコンテキスト

このファイルは、Cursor 等の AI がプロジェクトを理解し、適切にコード生成・修正するための要点をまとめたものです。**詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。**

---

## プロジェクト概要

- **SleepSupportApp** … 照度センサーを活用した睡眠支援の React Native (Expo) アプリ
- **技術**: Expo SDK 54, TypeScript (strict), Expo Router, Zustand, pnpm
- **構成**: FSD Lite（Feature-Sliced Design の簡易版）

---

## アーキテクチャ（ARCHITECTURE.md）

**必ず [ARCHITECTURE.md](./ARCHITECTURE.md) を参照すること。**

- **`app/`** … ルーティング定義のみ。ロジックは書かず、`@features/*` から import して表示するだけ
- **`src/features/[機能名]/`** … 機能単位で完結（画面・hooks・components・store・types をここに集約）
- **`src/shared/`** … 汎用コンポーネント・定数・lib・型。迷ったら feature に置く
- **Path alias**: `@features/*`, `@shared/components`, `@shared/constants`, `@shared/lib`, `@shared/types`
- **禁止**: 旧パス `src/constants/`, `src/components/`, `src/hooks/`, `src/screens/`, `src/types/` は使用しない

---

## Taskfile（コミット・push 前のチェック）

Git フックは使わず、**Task (go-task) で手動実行**します。

| タスク | 説明 | いつ使うか |
|--------|------|------------|
| `task pre-commit` | ステージ済みファイルに lint-staged（ESLint + Prettier）を実行 | コミット前 |
| `task pre-push` | 現在のブランチが `main` / `master` なら警告して終了コード 1 | push 前 |
| `task check-before-push` | pre-commit → pre-push を順に実行 | コミット＆push 前の一括確認 |

```bash
# 利用可能なタスク一覧
task --list
```

定義は ** [Taskfile.yml](./Taskfile.yml)** を参照。

---

## 開発コマンド（pnpm）

```bash
pnpm start          # Expo 開発サーバー
pnpm run check      # lint + typecheck + format:check 一括
pnpm run lint       # ESLint
pnpm run lint:fix   # ESLint 自動修正
pnpm run format     # Prettier 書き換え
pnpm run typecheck  # tsc --noEmit
pnpm run setup      # 環境チェック
pnpm run reset      # node_modules 再構築（詰まったとき）
```

---

## 新機能を追加するとき

1. `src/features/[新機能名]/` を作成し、その中に `index.ts`, `[名前]Screen.tsx`, `components/`, `hooks/`, `types.ts` 等を配置
2. `app/(tabs)/[タブ名].tsx` を追加し、該当 Screen を import して表示するだけにする
3. 共通で使うものだけ `src/shared/` に追加

命名: 画面は `[機能名]Screen.tsx`、フックは `use[名前].ts`、ストアは `[機能名]Store.ts`。

---

## 注意（AI向け）

- **過度な抽象化は避ける**（ハッカソン向けでシンプルに）
- **feature は自己完結**（他 feature に依存しない）
- **shared は最小限**（迷ったら feature に置く）
- **コメントは日本語でよい**
- コードを触るときは、上記アーキテクチャと [ARCHITECTURE.md](./ARCHITECTURE.md) に従うこと
