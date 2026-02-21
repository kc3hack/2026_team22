import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@shared/constants';
import { useAmbientLight } from './hooks/useAmbientLight';
import { LightMeter } from './components/LightMeter';
import type { SleepEnvironment } from './types';
import { LIGHT_CONSTANTS } from './constants';

const SOURCE_LABELS: Record<string, string> = {
  light_sensor: '照度センサー',
  camera: 'カメラ推定',
  unavailable: '利用不可',
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
 * 睡眠環境の照度を測定・評価する
 * バックグラウンドタスク機能にも対応
 */
export const LightSensorScreen: React.FC = () => {
  console.warn('[LightSensorScreen] mounted');
  const {
    lux,
    source,
    isAvailable,
    isActive,
    isBackgroundActive,
    startSensor,
    stopSensor,
    startBackgroundTask,
    stopBackgroundTask,
  } = useAmbientLight();

  const sleepEnvironment = lux !== null ? evaluateSleepEnvironment(lux) : null;

  // センサーが利用可能な場合、自動的に開始
  useEffect(() => {
    if (isAvailable && !isActive && !isBackgroundActive) {
      startSensor();
    }
  }, [isAvailable, isActive, isBackgroundActive, startSensor]);

  const handleStartBackgroundTask = async () => {
    await startBackgroundTask();
  };

  const handleStopBackgroundTask = async () => {
    await stopBackgroundTask();
  };

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
        {/* フォアグラウンド計測ボタン */}
        <TouchableOpacity
          style={[styles.button, isActive ? styles.buttonStop : styles.buttonStart]}
          onPress={isActive ? stopSensor : startSensor}
          disabled={!isAvailable || isBackgroundActive}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'フォアグラウンド計測停止' : 'フォアグラウンド計測開始'}
          </Text>
        </TouchableOpacity>

        {/* バックグラウンドタスクボタン（Androidのみ） */}
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={[
              styles.button,
              isBackgroundActive ? styles.buttonBackgroundStop : styles.buttonBackgroundStart,
            ]}
            onPress={isBackgroundActive ? handleStopBackgroundTask : handleStartBackgroundTask}
            disabled={!isAvailable}
          >
            <Text style={styles.buttonText}>
              {isBackgroundActive ? 'バックグラウンド計測停止' : 'バックグラウンド計測開始'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.statusText}>
          フォアグラウンド: {isAvailable ? (isActive ? '動作中' : '停止中') : '利用不可'}
        </Text>
        {Platform.OS === 'android' && (
          <Text style={styles.statusText}>
            バックグラウンド: {isBackgroundActive ? '動作中' : '停止中'}
          </Text>
        )}
        <Text style={styles.statusText}>データソース: {SOURCE_LABELS[source] ?? source}</Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
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
    fontSize: 21,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 18,
    color: COLORS.text.dark,
    opacity: 0.7,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonStart: {
    backgroundColor: COLORS.primary,
  },
  buttonStop: {
    backgroundColor: COLORS.error,
  },
  buttonBackgroundStart: {
    backgroundColor: '#8B5CF6',
  },
  buttonBackgroundStop: {
    backgroundColor: '#EC4899',
  },
  buttonText: {
    color: COLORS.text.dark,
    fontSize: 23,
    fontWeight: '600',
  },
  statusText: {
    color: COLORS.text.dark,
    opacity: 0.5,
    fontSize: 16,
  },
});
