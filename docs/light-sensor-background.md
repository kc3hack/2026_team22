# バックグラウンド光センサー機能

v1.1.0 より、画面がオフの状態でも光センサーで照度情報を取得し続けることができる **バックグラウンド計測機能** が追加されました。

## 対応プラットフォーム

- **Android**: ✅ フル対応
- **iOS**: ❌ 非対応（ネイティブ実装が必要）
- **Web**: ❌ 非対応

## 必要な設定

**バックグラウンド機能を使用するには、Expo Development Build が必須です**。

### Development Build の構築方法

```bash
# Development Build を構築
eas build --platform android --profile preview

# または、クラウド上でビルド後、QRコードでEAS Goアプリからインストール
eas build --platform android --profile preview --wait

# ローカルでビルド（EAS アカウント不要）
npx expo prebuild --clean
npx expo run:android
```

> **注意**: 通常の `pnpm start` + Expo Go では、`react-native-background-actions` は動作しません。  
> Development Build が必要な理由は、ネイティブモジュールの初期化が必要なためです。

## 使用方法

Light Sensor 画面で以下の2つのボタンが表示されます:

1. **フォアグラウンド計測開始/停止**
   - 通常のセンサー読み込み（画面が見える状態で動作）
   - Expo Go でも動作

2. **バックグラウンド計測開始/停止** (Android のみ)
   - 画面をオフにしても照度情報を取得し続ける
   - **Development Build で実行した場合のみ有効**
   - デバイスの通知バーに「Light Sensor Monitoring」という通知が表示される

## 技術仕様

| 項目                         | 値                                        |
| ---------------------------- | ----------------------------------------- |
| パッケージ                   | `react-native-background-actions` ^1.0.27 |
| 更新間隔（フォアグラウンド） | 500ms                                     |
| 更新間隔（バックグラウンド） | 2000ms                                    |
| 対応OS                       | Android 6.0+                              |
| 通知チャネルID               | `light_sensor_channel`                    |
| タスク名                     | `LightSensorBackgroundTask`               |

## 実装詳細

**変更されたファイル:**

1. **package.json** - `react-native-background-actions` を追加
2. **app.json** - Android パーミッション設定、プラグイン登録
3. **constants.ts** - バックグラウンド関連定数を追加
4. **LightSensorStore.ts** （新規）- Zustand ストアで背景タスク状態を管理
5. **useLightSensor.ts** - `startBackgroundTask()`, `stopBackgroundTask()` 関数を追加
6. **LightSensorScreen.tsx** - バックグラウンドボタンの UI 追加

**権限設定（app.json の android.permissions）:**

```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.POST_NOTIFICATIONS"
]
```

## トラブルシューティング

| 症状                                 | 原因・対処                                            |
| ------------------------------------ | ----------------------------------------------------- |
| バックグラウンドボタンが表示されない | iOS または Web を使用している（Android のみ対応）     |
| バックグラウンド計測が開始できない   | Expo Go で実行している場合は Development Build が必要 |
| 通知が表示されない                   | Android の通知権限が許可されているか確認              |
| バックグラウンドタスク開始時にエラー | Development Build を使用しているか確認                |

## 今後の対応予定

- iOS でのバックグラウンド計測実装（ネイティブコード統合が必要）
- AsyncStorage を利用したバックグラウンドデータ永続化
- バックグラウンドタスク実行時のデータ同期機能
