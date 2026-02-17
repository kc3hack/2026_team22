import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '@shared/constants';
import type { SleepLogEntry } from '../types';

interface SleepLogListProps {
  /** ログ一覧 */
  logs: SleepLogEntry[];
}

/** スコアに応じた色 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/** 減点の詳細を生成 */
const getDetails = (log: SleepLogEntry): string => {
  const details: string[] = [];
  if (log.phase1Warning) details.push('📱 Phase1警告');
  if (log.phase2Warning) details.push('📱 Phase2警告');
  if (log.lightExceeded) details.push('💡 明るすぎ');
  if (log.noiseExceeded) details.push('🔊 うるさい');
  if (log.bonus > 0) details.push('⭐ ボーナス+10');
  return details.length > 0 ? details.join('  ') : '✨ 完璧な睡眠準備';
};

/**
 * 睡眠ログ一覧コンポーネント
 */
export const SleepLogList: React.FC<SleepLogListProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>まだ睡眠ログがありません</Text>
        <Text style={styles.emptyHint}>睡眠モニターを使って就寝準備を記録しましょう</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{item.date}</Text>
            <Text style={[styles.logScore, { color: getScoreColor(item.score) }]}>
              {item.score}点
            </Text>
          </View>
          <Text style={styles.logDetails}>{getDetails(item)}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.dark,
  },
  logScore: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  logDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
