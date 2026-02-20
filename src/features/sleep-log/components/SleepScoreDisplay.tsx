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
      <View style={styles.scoreRing}>
        <View style={[styles.scoreCircle, { borderColor: color }]}>
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
    padding: 20,
  },
  dateLabel: {
    fontSize: 17,
    color: '#94A3B8',
    marginBottom: 16,
    fontWeight: '500',
  },
  scoreRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  scoreValue: {
    fontSize: 55,
    fontWeight: '500',
    paddingTop: 30,
    marginTop: 15,
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 25,
    marginBottom: 45,
    color: '#94A3B8',
  },
});
