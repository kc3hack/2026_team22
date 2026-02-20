import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import { ENVIRONMENT_THRESHOLDS } from '../constants';

interface EnvironmentStatusProps {
  /** 照度（lux） */
  lightLux: number | null;
  /** 音圧レベル（dB） */
  noiseDb: number | null;
  /** 光がNGか */
  isLightExceeded: boolean;
  /** 音がNGか */
  isNoiseExceeded: boolean;
}

/**
 * 環境ステータス表示
 * 光と音のリアルタイムステータス。NGライン超過時にアラート色で表示。
 */
export const EnvironmentStatus: React.FC<EnvironmentStatusProps> = ({
  lightLux,
  noiseDb,
  isLightExceeded,
  isNoiseExceeded,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 睡眠環境</Text>

      <View style={styles.metersRow}>
        {/* 光 */}
        <View style={[styles.meterCard, isLightExceeded && styles.meterCardAlert]}>
          <Text style={styles.meterEmoji}>💡</Text>
          <Text style={styles.meterLabel}>照度</Text>
          <Text style={[styles.meterValue, isLightExceeded && styles.meterValueAlert]}>
            {lightLux !== null ? `${Math.round(lightLux)}` : '--'}
          </Text>
          <Text style={styles.meterUnit}>lux</Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  lightLux === null ? '#64748B' : isLightExceeded ? COLORS.error : COLORS.success,
              },
            ]}
          />
          <Text style={styles.threshold}>基準: {ENVIRONMENT_THRESHOLDS.LIGHT_MAX_LUX} lux以下</Text>
        </View>

        {/* 音 */}
        <View style={[styles.meterCard, isNoiseExceeded && styles.meterCardAlert]}>
          <Text style={styles.meterEmoji}>🔊</Text>
          <Text style={styles.meterLabel}>音圧</Text>
          <Text style={[styles.meterValue, isNoiseExceeded && styles.meterValueAlert]}>
            {noiseDb !== null ? `${noiseDb}` : '--'}
          </Text>
          <Text style={styles.meterUnit}>dB</Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  noiseDb === null ? '#64748B' : isNoiseExceeded ? COLORS.error : COLORS.success,
              },
            ]}
          />
          <Text style={styles.threshold}>基準: {ENVIRONMENT_THRESHOLDS.NOISE_MAX_DB} dB以下</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 16,
  },
  metersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meterCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  meterCardAlert: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  meterEmoji: {
    fontSize: 31,
    marginBottom: 8,
  },
  meterLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  meterValue: {
    fontSize: 47,
    fontWeight: '300',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  meterValueAlert: {
    color: COLORS.error,
  },
  meterUnit: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  threshold: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
