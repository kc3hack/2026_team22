import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import type { SleepEnvironment } from '../types';

interface LightMeterProps {
  illuminance: number | null;
  sleepEnvironment: SleepEnvironment | null;
}

/**
 * 照度メーターコンポーネント
 */
export const LightMeter: React.FC<LightMeterProps> = ({ illuminance, sleepEnvironment }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.meterContainer}>
        <Text style={styles.luxValue}>{illuminance !== null ? Math.round(illuminance) : '--'}</Text>
        <Text style={styles.luxUnit}>lux</Text>
      </View>

      {sleepEnvironment && (
        <View style={styles.evaluationContainer}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>睡眠環境スコア</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(sleepEnvironment.score) }]}>
              {sleepEnvironment.score}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${sleepEnvironment.score}%`,
                  backgroundColor: getScoreColor(sleepEnvironment.score),
                },
              ]}
            />
          </View>

          <Text style={styles.recommendation}>{sleepEnvironment.recommendation}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  meterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.background.dark,
    borderWidth: 4,
    borderColor: COLORS.primary,
    marginBottom: 30,
  },
  luxValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text.dark,
  },
  luxUnit: {
    fontSize: 18,
    color: COLORS.text.dark,
    opacity: 0.7,
  },
  evaluationContainer: {
    width: '100%',
    backgroundColor: COLORS.background.dark,
    borderRadius: 16,
    padding: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.text.dark,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendation: {
    fontSize: 14,
    color: COLORS.text.dark,
    lineHeight: 22,
    textAlign: 'center',
  },
});
