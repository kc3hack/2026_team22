# feat/background を main にマージする際のコンフリクト修正要件

`feat/background` を `main` にマージした際に発生したコンフリクトの解消手順をまとめています。

## コンフリクト発生ファイル（4ファイル）

| ファイル                                          | 概要                                                         |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `README.md`                                       | 開発サーバー起動セクション直後の記述が競合                   |
| `package.json`                                    | 依存パッケージと pnpm パッチ設定が競合                       |
| `pnpm-lock.yaml`                                  | 上記 package.json の差分に伴うロックファイル競合（多数箇所） |
| `src/features/light-sensor/LightSensorScreen.tsx` | フォントサイズ・スタイルの差分                               |

---

## 1. README.md

### 競合箇所

「開発サーバーの起動」セクションの直後（125行目付近）。

### 修正方針

**両方の内容を残し、順序を整理する。**

- **HEAD（main）**: `.env.expo.local` と Supabase ローカル開発の説明  
  → そのまま残す（1文＋リンク）。
- **feat/background**: バックグラウンド光センサー機能の説明（「### バックグラウンド光センサー機能について」〜「#### 今後の対応予定」まで）  
  → そのまま残す。

### 修正後イメージ

1. まず main の1文を記載
   - 「Expo の**ローカル用**環境変数（Supabase の URL など）は **`.env.expo.local`** に書きます。`task dev-up` を実行するとこのファイルが自動で更新されます。詳細は [docs/supabase-local.md](docs/supabase-local.md) を参照。」
2. 続けて feat/background の「### バックグラウンド光センサー機能について」以降のセクションをそのまま追加
   - コンフリクトマーカー（`<<<<<<< HEAD` / `=======` / `>>>>>>> origin/feat/background`）はすべて削除する。

---

## 2. package.json

### 競合箇所（2箇所）

#### 2-1. dependencies（expo 周り）

- **HEAD（main）**: `expo-av`, `expo-camera` を追加済み。
- **feat/background**: `expo-build-properties` を追加済み。

**修正方針**: **3つとも残す**（main の2つ ＋ feat/background の1つ）。

```json
"expo-av": "^16.0.8",
"expo-build-properties": "~1.0.10",
"expo-camera": "~17.0.10",
```

（アルファベット順でも expo の並び方に合わせても可。上記は expo-build-properties を間に入れた例。）

#### 2-2. 末尾の pnpm 設定

- **HEAD（main）**: `"private": true` のみで終了。
- **feat/background**: `"private": true` に加え、`"pnpm": { "patchedDependencies": { ... } }` を追加。

**修正方針**: **feat/background の pnpm ブロックを採用**（パッチがバックグラウンド機能に必要）。

```json
  "private": true,
  "pnpm": {
    "patchedDependencies": {
      "react-native-background-actions": "patches/react-native-background-actions.patch",
      "expo-sensors": "patches/expo-sensors.patch"
    }
  }
}
```

---

## 3. pnpm-lock.yaml

### 競合の原因

`package.json` の dependencies の差分（expo-av / expo-camera vs expo-build-properties）に伴い、ロックファイル全体で多数のコンフリクトが発生しています。

### 修正方針（推奨）

**手でマージしない。** 以下を推奨します。

1. 上記のとおり **package.json のコンフリクトだけを解消**する。
2. **コンフリクトしている pnpm-lock.yaml** は `git checkout --theirs pnpm-lock.yaml` で feat/background 版を採用する（または main 版を採用しても可）。
3. リポジトリルートで **`pnpm install --no-frozen-lockfile`** を実行し、**pnpm-lock.yaml を package.json に合わせて更新**する。
4. 更新された **pnpm-lock.yaml は必ずコミット**する（イグノアしない）。

**ロックファイルについて**: `pnpm-lock.yaml` は **.gitignore に含めず、リポジトリにコミットする**ものです。同じ依存バージョンを全員で揃えるために必要です。コンフリクト時は「どちらか一方を採用 → pnpm install で再生成 → その結果をコミット」という流れにします。

---

## 4. src/features/light-sensor/LightSensorScreen.tsx

### 競合箇所（2箇所）

#### 4-1. buttonText の fontSize（169行目付近）

- **HEAD（main）**: `fontSize: 23`
- **feat/background**: `fontSize: 16`

**修正方針**: どちらを採用するかは UI 方針に依存。

- ボタン文字を大きくしたい → **main の `23` を採用**。
- 他画面との統一やコンパクトさを優先 → **feat/background の `16` を採用**。  
  未指定の場合は、main の `23` を採用するか、チームで相談して決定。

#### 4-2. statusText のスタイル（179行目付近）

- **HEAD（main）**: `fontSize: 16` のみ。
- **feat/background**: `fontSize: 12`, `marginVertical: 4` を追加。

**修正方針**: 両方の変更を反映してよい。

- フォントサイズ: どちらかに統一（推奨: `16` で読みやすくする、または `12` でサブテキストらしくする）。
- **feat/background の `marginVertical: 4` は残す**とレイアウトが安定する。

例（main の fontSize を活かしつつ margin を追加）:

```ts
statusText: {
  color: COLORS.text.dark,
  opacity: 0.5,
  fontSize: 16,
  marginVertical: 4,
},
```

---

## 実施順序の目安

1. **package.json** のコンフリクトを解消（両依存＋pnpm パッチを残す）。
2. **README.md** のコンフリクトを解消（main の1文＋feat/background のバックグラウンド説明を両方残す）。
3. **LightSensorScreen.tsx** のコンフリクトを解消（上記方針で fontSize / margin を決定）。
4. **pnpm-lock.yaml** は解消せず、`pnpm install` で再生成する。
5. `pnpm run check` または `pnpm run lint` / `pnpm run typecheck` でビルド・lint が通ることを確認。
6. マージコミットを完成させる: `git add .` → `git commit`（メッセージ例: `Merge feat/background into main`）。

---

## 注意事項

- **patches/** ディレクトリ**（`react-native-background-actions.patch`, `expo-sensors.patch`）** は feat/background 側に含まれている想定です。マージ後もこれらのパッチが存在することを確認してください。
- バックグラウンド機能は **Expo Development Build 必須** のため、README の「バックグラウンド光センサー機能について」の記述を消さないようにしてください。
