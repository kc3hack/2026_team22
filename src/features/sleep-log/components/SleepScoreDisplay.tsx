import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@shared/constants';

interface SleepScoreDisplayProps {
  /** スコア (0-100) */
  score: number;
  /** 日付ラベル */
  dateLabel: string;
}

/** スコアに応じた色 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/** スコアに応じた内側グロー色 */
const getInnerGlow = (score: number): string => {
  if (score >= 80) return 'rgba(16, 185, 129, 0.12)';
  if (score >= 50) return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(239, 68, 68, 0.1)';
};

/**
 * 睡眠スコア表示コンポーネント
 */
export const SleepScoreDisplay: React.FC<SleepScoreDisplayProps> = ({ score, dateLabel }) => {
  const color = getScoreColor(score);
  const innerGlow = getInnerGlow(score);

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <View style={[styles.scoreWrapper, Platform.OS === 'ios' ? { shadowColor: color } : {}]}>
        <View
          style={[
            styles.scoreCircle,
            {
              borderColor: color,
              backgroundColor: innerGlow,
            },
          ]}
        >
          <Text style={[styles.scoreValue, { color }]}>{score}</Text>
          <Text style={styles.scoreUnit}>点</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  dateLabel: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreWrapper: Platform.select({
    ios: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }),
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  scoreUnit: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: -4,
  },
});
