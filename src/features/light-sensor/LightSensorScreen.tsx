import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@shared/constants';
import { useAmbientLight } from '../../hooks/useAmbientLight';
import { LightMeter } from './components/LightMeter';
import type { SleepEnvironment } from './types';
import { LIGHT_CONSTANTS } from './constants';

const SOURCE_LABELS: Record<string, string> = {
  light_sensor: '照度センサー',
  camera: 'カメラ推定',
  unavailable: '利用不可',
};

const ORIENTATION_LABELS: Record<string, string> = {
  face_up: '画面が上向き',
  face_down: '画面が下向き',
  other: 'その他',
};

/**
 * 照度から睡眠環境を評価する
 */
const evaluateSleepEnvironment = (lux: number): SleepEnvironment => {
  if (lux <= LIGHT_CONSTANTS.OPTIMAL_SLEEP_LUX) {
    return {
      currentLux: lux,
      isSuitableForSleep: true,
      recommendation: '完璧な睡眠環境です。おやすみなさい！',
      score: 100,
    };
  } else if (lux <= LIGHT_CONSTANTS.PREPARE_SLEEP_LUX) {
    return {
      currentLux: lux,
      isSuitableForSleep: false,
      recommendation: '睡眠の準備に適した明るさです。もう少し暗くするとより良いでしょう。',
      score: 70,
    };
  } else if (lux <= LIGHT_CONSTANTS.NORMAL_INDOOR_LUX) {
    return {
      currentLux: lux,
      isSuitableForSleep: false,
      recommendation: '通常の室内の明るさです。睡眠前は照明を落としましょう。',
      score: 40,
    };
  }
  return {
    currentLux: lux,
    isSuitableForSleep: false,
    recommendation: '明るすぎます。睡眠の質を高めるために、照明を暗くしてください。',
    score: 10,
  };
};

/**
 * 照度センサー画面コンポーネント
 * デバイスの向きに応じて照度センサーとカメラを使い分け、睡眠環境の照度を測定・評価する
 */
export const LightSensorScreen: React.FC = () => {
  const { lux, source, orientation } = useAmbientLight();

  const sleepEnvironment = lux !== null ? evaluateSleepEnvironment(lux) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>照度センサー</Text>
        <Text style={styles.subtitle}>睡眠環境をチェック</Text>
      </View>

      <View style={styles.content}>
        {source === 'unavailable' ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>照度を検出できません</Text>
            {Platform.OS === 'web' && (
              <Text style={styles.errorHint}>照度センサーはAndroidデバイスでのみ利用可能です</Text>
            )}
          </View>
        ) : (
          <LightMeter illuminance={lux} sleepEnvironment={sleepEnvironment} />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.statusText}>
          向き: {ORIENTATION_LABELS[orientation] ?? orientation}
        </Text>
        <Text style={styles.statusText}>
          データソース: {SOURCE_LABELS[source] ?? source}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.dark,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: COLORS.text.dark,
    opacity: 0.7,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.text.dark,
    opacity: 0.5,
    fontSize: 12,
  },
});
