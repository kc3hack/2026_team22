import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

/**
 * 睡眠スコア表示コンポーネント
 */
export const SleepScoreDisplay: React.FC<SleepScoreDisplayProps> = ({ score, dateLabel }) => {
  const color = getScoreColor(score);

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={styles.scoreUnit}>点</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
