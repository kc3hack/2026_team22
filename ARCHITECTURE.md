# SleepSupportApp - AI駆動開発アーキテクチャガイド

このドキュメントはAI（Cursor, Windsurf, ChatGPT等）がプロジェクトを理解し、効率的にコードを生成するためのガイドです。

---

## 技術スタック

| カテゴリ         | 技術                                   | バージョン         |
| ---------------- | -------------------------------------- | ------------------ |
| Package Manager  | pnpm                                   | 9.x                |
| Framework        | React Native (Expo)                    | SDK 54             |
| Routing          | Expo Router                            | File-based routing |
| Language         | TypeScript                             | strict mode        |
| State Management | Zustand (Global) / React Hooks (Local) | -                  |
| Styling          | StyleSheet (React Native標準)          | -                  |
| 外部連携         | LLM API, Google Calendar API           | 実装予定           |

---

## ディレクトリ構成 (FSD Lite)

```
SleepSupportApp/
├── app/                          # Expo Router (ルーティング定義のみ)
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブ設定
│   │   ├── index.tsx             # ホームタブ -> @features/home
│   │   └── profile.tsx           # プロフィールタブ -> @features/profile
│   ├── _layout.tsx               # Root Layout (Provider設定)
│   └── +not-found.tsx            # 404ページ
│
├── src/
│   ├── features/                 # ★ 機能単位で完結させる（主戦場）
│   │   ├── auth/                 # 認証機能
│   │   ├── home/                 # ホーム画面
│   │   ├── light-sensor/         # 照度センサー機能
│   │   ├── profile/              # プロフィール画面
│   │   └── [新機能]/             # 新機能はここに追加
│   │
│   └── shared/                   # アプリ全体で共有するもの
│       ├── components/           # 汎用UIコンポーネント (Button, Input等)
│       ├── constants/            # 定数 (COLORS等)
│       ├── lib/                  # 外部サービス接続 (LLM, GoogleCalendar)
│       └── types/                # 共通型定義
│
├── assets/                       # 画像・フォント等
├── babel.config.js               # Path alias設定
└── tsconfig.json                 # TypeScript設定
```

### 使用しないフォルダ（旧構成・作成禁止）

FSD Lite 移行により以下のパスは**使用しません**。新規作成しないでください。

| 旧パス            | 正しい新パス                                                 |
| ----------------- | ------------------------------------------------------------ |
| `src/constants/`  | `src/shared/constants/`                                      |
| `src/components/` | `src/shared/components/` または `src/features/*/components/` |
| `src/hooks/`      | `src/features/*/hooks/`                                      |
| `src/screens/`    | `src/features/*/[機能名]Screen.tsx`                          |
| `src/types/`      | `src/shared/types/` または `src/features/*/types.ts`         |

---

## コーディングルール

### 1. ルーティング (`app/`)

**ルール**: ロジックを書かない。`src/features`からimportして表示するだけ。

```tsx
// ✅ 良い例: app/(tabs)/index.tsx
import { HomeScreen } from '@features/home';
export default function HomeTab() {
  return <HomeScreen />;
}

// ❌ 悪い例: app/(tabs)/index.tsx にロジックを書く
export default function HomeTab() {
  const [data, setData] = useState([]); // ❌ ここに書かない
  // ...
}
```

### 2. Feature (`src/features/[FeatureName]/`)

**ルール**: 機能に必要なものを全てこのフォルダ内に配置する（Colocation）。

```
src/features/[機能名]/
├── index.ts              # Public API (外部に公開するもののexport)
├── [機能名]Screen.tsx    # メイン画面コンポーネント
├── components/           # この機能専用のUIコンポーネント
├── hooks/                # この機能専用のカスタムフック
├── [機能名]Store.ts      # Zustandストア（必要な場合）
├── api/                  # API通信処理（必要な場合）
├── types.ts              # この機能の型定義
└── constants.ts          # この機能の定数
```

**例: light-sensor機能**

```
src/features/light-sensor/
├── index.ts              # export { LightSensorScreen, useLightSensor, ... }
├── LightSensorScreen.tsx # メイン画面
├── components/
│   └── LightMeter.tsx    # 照度メーター表示
├── hooks/
│   └── useLightSensor.ts # センサーロジック
├── types.ts              # LightSensorData, SleepEnvironment
└── constants.ts          # LIGHT_CONSTANTS
```

### 3. Shared (`src/shared/`)

**ルール**: 本当に汎用的なもの**だけ**を置く。迷ったらfeatureに置く。

- `components/`: 2つ以上のfeatureで使うUIコンポーネント
- `lib/`: 外部サービスのクライアント設定
- `constants/`: アプリ全体で使う定数（テーマカラー等）
- `types/`: 汎用的な型定義

---

## Path Alias

```typescript
// 使用可能なエイリアス
import { HomeScreen } from '@features/home';
import { Button } from '@shared/components';
import { COLORS } from '@shared/constants';
import { llmClient } from '@shared/lib';
```

---

## 状態管理

### ローカル状態: React Hooks

```tsx
const [count, setCount] = useState(0);
```

### グローバル状態: Zustand

```typescript
// src/features/auth/authStore.ts
import { create } from 'zustand';

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  setUser: user => set({ user }),
}));
```

---

## 外部連携（実装予定）

### LLM接続

```typescript
import { llmClient } from '@shared/lib';

// チャット形式で問い合わせ
const response = await llmClient.chat('睡眠の質を改善するアドバイスをください');
```

### Google Calendar

```typescript
import { googleCalendar } from '@shared/lib';

// イベント取得
const events = await googleCalendar.getEvents();

// イベント作成
await googleCalendar.createEvent({
  title: '就寝時間',
  start: new Date(),
  end: new Date(),
});
```

---

## 新機能追加フロー

### 1. 機能フォルダ作成

```
「src/features/sleep-log を作成して、睡眠ログ機能を実装して」
```

### 2. 画面追加

```
「src/features/sleep-log/SleepLogScreen.tsx を作成して」
```

### 3. ルーティング追加

```
「app/(tabs)/sleep-log.tsx を作成して、SleepLogScreenを表示して」
```

### 4. ロジック追加

```
「src/features/sleep-log/hooks/useSleepLog.ts を作成して、睡眠データを管理するフックを実装して」
```

---

## ファイル命名規則

| 種類               | 命名パターン                   | 例                  |
| ------------------ | ------------------------------ | ------------------- |
| 画面コンポーネント | `[機能名]Screen.tsx`           | `HomeScreen.tsx`    |
| コンポーネント     | PascalCase                     | `LightMeter.tsx`    |
| フック             | `use[名前].ts`                 | `useLightSensor.ts` |
| ストア             | `[機能名]Store.ts`             | `authStore.ts`      |
| 型定義             | `types.ts`                     | `types.ts`          |
| 定数               | `constants.ts`                 | `constants.ts`      |
| API                | `[機能名]Api.ts` または `api/` | `authApi.ts`        |

---

## テーマカラー

```typescript
// src/shared/constants/index.ts
export const COLORS = {
  primary: '#6366F1', // メインカラー（紫）
  secondary: '#8B5CF6', // サブカラー
  background: {
    dark: '#0F172A', // 暗い背景
    light: '#F8FAFC', // 明るい背景
  },
  text: {
    dark: '#F8FAFC', // 暗い背景上のテキスト
    light: '#0F172A', // 明るい背景上のテキスト
  },
  success: '#10B981', // 成功（緑）
  warning: '#F59E0B', // 警告（オレンジ）
  error: '#EF4444', // エラー（赤）
};
```

---

## コマンド

```bash
# 開発サーバー起動
pnpm start

# TypeScriptチェック
pnpm run typecheck

# Lint
pnpm run lint
pnpm run lint:fix

# フォーマット
pnpm run format
```

---

## 注意事項

1. **過度な抽象化は避ける** - ハッカソン向けなのでシンプルに保つ
2. **featureは自己完結** - 他のfeatureに依存しない
3. **sharedは最小限** - 迷ったらfeatureに置く
4. **コメントは日本語OK** - チームメンバーが理解しやすいように
