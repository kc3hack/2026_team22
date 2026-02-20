# エミュレータで「Network request failed」になる場合

## 想定される原因

### 1. 設定がビルド／Metro に反映されていない（最も多い）

- **Expo の `extra`（apiUrl, supabaseUrl）は Metro 起動時に `app.config.js` から読み込まれる。**
- すでに Metro が動いている状態で `write-expo-env.mjs` だけ実行すると、**既存の Metro は古い .env を保持したまま**になる。
- その結果、アプリは 127.0.0.1 のままの URL でリクエストし、エミュレータから届かず「Network request failed」になる。

### 2. エミュレータからホストへの接続先

- エミュレータ内の `127.0.0.1` は**エミュレータ自身**を指す。ホストの Supabase/API には届かない。
- ホストへは **`10.0.2.2`** を使う必要がある（Android の仕様）。
- `task dev-up-emulator` は `.env.expo.local` に API / Supabase ともに `10.0.2.2` を書き込む。

### 3. HTTP (cleartext) がブロックされている

- Android 9 以降はデフォルトで HTTP を許可しない。
- このプロジェクトでは `app.json` の `expo-build-properties` で `usesCleartextTraffic: true` を指定済み。**別タスクでビルドした apk を使っている場合は、そのビルドにも同じ設定が入っているか確認する。**

### 4. Supabase / API がホストで動いていない

- エミュレータは `10.0.2.2` でホストに届くが、**ホスト側で Supabase と API が起動している必要がある。**
- `task dev-up-emulator` は Supabase 起動 → docker-compose → write-expo-env → expo run:android の順で実行する。

---

## 対処手順

### 手順 A: Metro を止めてからやり直す（まず試す）

1. **Metro / Expo をすべて終了する**（別ターミナルで `expo start` や `npx expo run:android` を実行していた場合は Ctrl+C）。
2. 以下を**この順で**実行する。

   ```bash
   task dev-up-emulator
   ```

3. これで「write-expo-env → expo run:android」の順になり、**新しい Metro が最新の .env.expo.local を読む**。

### 手順 B: キャッシュを消してからビルドし直す

1. Metro を止める。
2. キャッシュを消してからエミュレータ用に書き直し・ビルドする。

   ```bash
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 node scripts/write-expo-env.mjs
   npx expo start --clear
   ```

3. 別ターミナルでエミュレータを起動し、表示された QR または「Run on Android device/emulator」で起動する。  
   または、Metro を止めたうえで以下でビルド＆起動する。

   ```bash
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 node scripts/write-expo-env.mjs
   npx expo run:android
   ```

### 手順 C: ネイティブをクリーンしてからやり直す

`extra` がネイティブ側に古く残っている可能性がある場合:

1. Metro を止める。
2. `android` フォルダを削除する（存在する場合）。

   ```bash
   rm -rf android
   ```

3. エミュレータ用に .env を書き、prebuild からやり直す。

   ```bash
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 node scripts/write-expo-env.mjs
   npx expo prebuild --clean
   npx expo run:android
   ```

   （Supabase と docker-compose は別途 `task supabase-start` と `docker-compose up -d` で起動しておく。）

### 手順 D: 実際に使われている URL を確認する

- アプリ起動後、ログイン画面などで Supabase にリクエストが飛ぶタイミングで、**Metro のターミナル**や **Logcat** に  
  `[supabase] using url: http://...` のようなログが出る（開発時のみ。`src/shared/lib/supabase.ts` で出力）。
- ここが `http://10.0.2.2:54321` になっていればエミュレータ用の設定は反映されている。  
  `127.0.0.1` のままなら、上記 A〜C のいずれかで「Metro / ビルドのやり直し」が必要。

---

## まとめ

- **「Network request failed」の多くは、Metro が古い .env のまま動いているか、ネイティブに古い extra が残っていることが原因。**
- **Metro を止めてから `task dev-up-emulator` を最初から実行する**か、**手順 B/C でキャッシュ／ネイティブをクリーンしてからビルドし直す**と解消することが多い。
