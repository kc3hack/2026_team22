/**
 * Metro の設定。
 * .env* をモジュールとして解決しないようにし、Babel が .env を JS としてパースしてしまうエラーを防ぐ。
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /\.env\.expo\.local$/,
  /\.env\.local$/,
  /\.env$/,
];

module.exports = config;
