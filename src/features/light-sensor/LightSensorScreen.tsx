import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS } from '@shared/constants';
import { useLightSensor } from './hooks/useLightSensor';
import { LightMeter } from './components/LightMeter';

/**
 * 照度センサー画面コンポーネント
 * 睡眠環境の照度を測定・評価する
 */
export const LightSensorScreen: React.FC = () => {
  const { data, isAvailable, isActive, sleepEnvironment, startSensor, stopSensor, error } =
    useLightSensor();

  // センサーが利用可能な場合、自動的に開始
  useEffect(() => {
    if (isAvailable && !isActive) {
      startSensor();
    }
  }, [isAvailable, isActive, startSensor]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>照度センサー</Text>
        <Text style={styles.subtitle}>睡眠環境をチェック</Text>
      </View>

      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {Platform.OS === 'web' && (
              <Text style={styles.errorHint}>照度センサーはAndroidデバイスでのみ利用可能です</Text>
            )}
          </View>
        ) : (
          <LightMeter illuminance={data?.illuminance ?? null} sleepEnvironment={sleepEnvironment} />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isActive ? styles.buttonStop : styles.buttonStart]}
          onPress={isActive ? stopSensor : startSensor}
          disabled={!isAvailable}
        >
          <Text style={styles.buttonText}>{isActive ? '計測停止' : '計測開始'}</Text>
        </TouchableOpacity>

        <Text style={styles.statusText}>
          センサー状態: {isAvailable ? (isActive ? '動作中' : '停止中') : '利用不可'}
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
  buttonText: {
    color: COLORS.text.dark,
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    color: COLORS.text.dark,
    opacity: 0.5,
    fontSize: 12,
  },
});
