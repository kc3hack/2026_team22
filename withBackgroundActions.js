// withBackgroundActions.js
const { withAndroidManifest } = require('@expo/config-plugins');

const withBackgroundActions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // メインアプリケーションの定義を取得
    const mainApplication = androidManifest.manifest.application[0];

    // サービスがまだ登録されていなければ追加する
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceName = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';
    const hasService = mainApplication.service.some(
      (s) => s.$['android:name'] === serviceName
    );

    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
        },
      });
    }

    return config;
  });
};

module.exports = withBackgroundActions;