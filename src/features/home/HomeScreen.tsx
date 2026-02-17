import React from 'react';
import { LightSensorScreen } from '@features/light-sensor';

/**
 * ホーム画面
 * アプリのメイン画面。現在は照度センサー機能を表示。
 *
 * 他の機能を追加する場合は、ここにコンポーネントを配置するか、
 * 新しい feature を作成して呼び出す。
 */
export const HomeScreen: React.FC = () => {
  return <LightSensorScreen />;
};
