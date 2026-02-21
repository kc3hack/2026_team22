# Gemini API Error の原因と対策

`API_KEY_INVALID` エラー（`API Key not found. Please pass a valid API key.`）が発生している原因として、いくつかの可能性が考えられます。プロジェクト（`.env` や `gemini.ts`）の実装とログを確認した結果、以下の対策を順に実施してください。

## 原因の推測

1. **設定されているAPIキー自体の無効化** 
   `.env` に記載されている `EXPO_PUBLIC_GEMINI_API_KEY` 自体が機能していない、または無効化されている可能性があります。
2. **キャッシュによる古い・未定義の変数の読み込み**
   環境変数を変更した後、Expo および Metro バンドラーのキャッシュが残っているため、新しく設定したキーが正しく反映されていない可能性があります。
3. **`task dev-up` 実効時の環境変数上書き**
   `task dev-up` を実行すると、`scripts/write-expo-env.mjs` によって `.env.expo.local` が自動生成されます。ここで `.env` に追記した内容が一部無視・上書きされ、うまく Expo に伝わっていない可能性があります。
4. **型や文字列としての "undefined" 挙動**
   環境変数が読み込めなかった場合、JavaScript バンドラ上で文字列の `"undefined"` として扱われ、`gemini.ts` 内での `if (!apiKey)` のチェックを通り抜け、そのまま API 側へ不正なキーとして投げられている可能性があります。

---

## 対策手順

### 1. APIキー自体の有効性を確認・再発行
まずは現在 `.env` に記載されているキー文字列がいまも有効か確認してください。
- **Google AI Studio**（[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)）にアクセスし、キーの状態を確認します。
- 必要であれば新しいキーを発行し、`.env` の `EXPO_PUBLIC_GEMINI_API_KEY` を更新してください。

### 2. 環境変数の確実な読み込み（Metroキャッシュクリア）
`.env` を変更した後は、古いキャッシュによる動作を防ぐために Metro の再起動が必須です。
現在実行中の `task dev-up` 等を停止し、以下のコマンドで起動し直してください：

```bash
task dev-down
task metro-stop
task dev-up
```
※ Expo単体だけを起動しているターミナルがある場合は `npx expo start -c` にて再起動をお試しください。

### 3. スクリプトの自動生成（`.env.expo.local`）への手動追記
現在の構成では `task dev-up` が `scripts/write-expo-env.mjs` を通じて `.env.expo.local` を生成・上書きするため、一時的にこれが原因となって環境変数が伝わっていないことがあります。
- 万が一上記でも解決しない場合は、**`.env.expo.local` ファイルに直接 `EXPO_PUBLIC_GEMINI_API_KEY=あなたのキー` を追記**してアプリが動くか試してみてください。
- （恒久対応としては、`scripts/write-expo-env.mjs` 内で元の `.env` も引き継ぐようにマージ処理を変更することをご検討ください）

### 4. アプリ側（`gemini.ts`）のチェック処理の強化
文字列になった `"undefined"` は `if (!apiKey)` のガードをすり抜けてしまいます。`src/shared/lib/gemini.ts` の 100行目付近にあるチェック処理を以下のように修正しておくことで、より安全にエラーをキャッチできます。

```typescript
// 修正前
if (!apiKey) {
    console.warn('⚠️ Gemini API Key is missing...');
    return false;
}

// 修正後
if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    console.warn('⚠️ Gemini API Key is missing or incorrectly mapped as "undefined". Please set it in .env');
    return false;
}
```

これらの対策（とくに **1. のキー確認** と **2. のキャッシュクリア**） をお試しいただくことで、エラーは解消されると考えられます。
