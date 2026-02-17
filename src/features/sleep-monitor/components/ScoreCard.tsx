import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';

interface ScoreCardProps {
  /** スコア (0-100) */
  score: number;
  /** スマホ操作時間（分） */
  usageMinutes: number;
}

/** スコアに応じた色を返す */
const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/** スコアに応じた評価テキスト */
const getScoreLabel = (score: number): string => {
  if (score >= 90) return '素晴らしい！';
  if (score >= 80) return '良好';
  if (score >= 60) return 'まずまず';
  if (score >= 40) return '改善の余地あり';
  return '要改善';
};

/**
 * 睡眠準備スコアカード
 * リアルタイムのスコアとスマホ操作時間を表示
 */
export const ScoreCard: React.FC<ScoreCardProps> = ({ score, usageMinutes }) => {
  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* スコア表示 */}
        <View style={styles.scoreSection}>
          <Text style={styles.label}>スコア</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>{getScoreLabel(score)}</Text>
        </View>

        {/* 操作時間 */}
        <View style={styles.usageSection}>
          <Text style={styles.label}>📱 スマホ操作</Text>
          <Text style={[styles.usageValue, usageMinutes >= 15 && styles.usageValueWarn]}>
            {usageMinutes}
          </Text>
          <Text style={styles.usageUnit}>分</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreMax: {
    fontSize: 12,
    color: '#64748B',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  usageSection: {
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 48,
    fontWeight: '300',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  usageValueWarn: {
    color: COLORS.warning,
  },
  usageUnit: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
