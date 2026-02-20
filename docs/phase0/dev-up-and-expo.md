# dev-up と Expo の環境変数

## Supabase は Auth のみ・DB は別

- **Supabase** … **認証（Auth）専用**（ログイン・セッション・JWT 発行）。Supabase の DB は使わない。
- **アプリのデータ**（users, sleep_plan_cache 等）… **別の PostgreSQL** で管理。開発時は docker-compose の DB、本番は Supabase 以外の DB や Supabase の PostgreSQL を「普通の DB」として使うことも可。

つまり「Supabase Auth で誰か判定 → アプリ用 DB にデータを保存」という構成です。

## dev-up では Expo は起動しない

**task dev-up** が起動するのは次のだけです。

- Supabase ローカル（**Auth 用**・Studio 等）
- docker-compose（API + **アプリ用 PostgreSQL**）

Expo は **別ターミナルで `task expo-start` または `pnpm start`** する運用にしています。

- Expo は対話的（リロードやメニュー操作）なので、task に含めると扱いづらい
- 1 ターミナル: バックエンド系、1 ターミナル: Expo の分けが一般的
- Android で Development Build をビルド・起動する場合は **`task expo-android`**（Java 17 を自動で使用）

## Expo の環境変数: .env から読む（推奨）

**Expo は .env から読む形にするのがおすすめ**です。

| 方式 | メリット | デメリット |
|------|----------|------------|
| **.env から読む** | どのターミナルで `pnpm start` しても同じ値。実機・別 PC も .env を変えるだけ。Expo が標準で `EXPO_PUBLIC_*` を .env から読むので追加設定不要。 | 初回や Supabase をやり直したときに .env の Supabase 値を更新する必要あり（下記の「dev-up で .env を更新」で自動化可能） |
| **コマンドで指定（eval）** | dev-up したターミナルでそのまま `pnpm start` すれば値が渡る。 | 別ターミナルで Expo を起動するたびに `eval "$(node scripts/supabase-env-for-compose.mjs)"` が必要。 |

このプロジェクトでは **Expo のローカル用**の環境変数は **`.env.expo.local`** に置いています。  
`app.config.js` で `dotenv` により `.env.expo.local` を読み、`process.env.EXPO_PUBLIC_*` が Metro に渡ります。  
名前で「ローカル用の Expo」と分かります。

## .env の Supabase 値をどうするか

**task dev-up** の最後で **scripts/write-expo-env.mjs** を実行しており、Supabase の接続情報（と `EXPO_PUBLIC_API_URL`）を **`.env.expo.local`** に書き出します。

- どのターミナルで `pnpm start` しても、Expo は app.config.js 経由で `.env.expo.local` を読むのでそのまま動く。
- dev-up するたびに `.env.expo.local` が更新される。このファイルは .gitignore 済み。
