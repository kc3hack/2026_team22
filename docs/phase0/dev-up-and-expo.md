# dev-up と Expo の環境変数

## Supabase は Auth のみ・DB は別

- **Supabase** … **認証（Auth）専用**（ログイン・セッション・JWT 発行）。Supabase の DB は使わない。
- **アプリのデータ**（users, sleep_plan_cache 等）… **別の PostgreSQL** で管理。開発時は docker-compose の DB、本番は Supabase 以外の DB や Supabase の PostgreSQL を「普通の DB」として使うことも可。

つまり「Supabase Auth で誰か判定 → アプリ用 DB にデータを保存」という構成です。

## dev-up / dev-up-emulator の役割

**task dev-up**（実機用）および **task dev-up-emulator**（エミュレータ用）は次の順で実行します。

- Supabase ローカル（**Auth 用**・Studio 等）
- docker-compose（API + **アプリ用 PostgreSQL**）
- DB マイグレーション
- **write-expo-env.mjs** で `.env.expo.local` を更新
- **Android Development Build のビルド＆起動**（`expo run:android`、Java 17 使用）

実機の場合は **実機を USB 接続してから**、エミュレータの場合は **エミュレータを起動してから** それぞれのタスクを実行してください。環境構築からアプリのビルド・起動まで一括で行われます。

- **アプリのコードだけ変更してビルドし直したいとき**は **`task expo-android`** を実行する（環境はそのまま。事前に一度 `dev-up` または `dev-up-emulator` で `.env.expo.local` を作っておくこと）。
- Expo 開発サーバー（Metro）のみ起動したい場合は、別ターミナルで **`task expo-start`** または **`pnpm start`** を実行する。

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

**task dev-up** / **task dev-up-emulator** のなかで **scripts/write-expo-env.mjs** を実行しており、Supabase の接続情報（と `EXPO_PUBLIC_API_URL`）を **`.env.expo.local`** に書き出します。そののち Android のビルドが走るため、ビルド時にもこのファイルが参照されます。

- どのターミナルで `pnpm start` しても、Expo は app.config.js 経由で `.env.expo.local` を読むのでそのまま動く。
- dev-up / dev-up-emulator するたびに `.env.expo.local` が更新される。このファイルは .gitignore 済み。
