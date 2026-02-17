/**
 * Babel - JS/TSのトランスパイル設定
 * - Expo/React Native用の変換（babel-preset-expo）
 * - パスエイリアス: @ → src/, @features → src/features/, @shared → src/shared/
 *   これで import X from '@/shared/components' のように書ける
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@features': './src/features',
            '@shared': './src/shared',
          },
        },
      ],
    ],
  };
};
