/**
 * Expo の設定。
 * ローカル用の環境変数は .env.expo.local から読み込む（task dev-up で自動生成される）。
 */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.expo.local') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');
module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
    },
  },
};
