import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { addDaysToDateString } from '@shared/lib';
import type { SleepLogEntry } from '../types';

// Android で LayoutAnimation を有効化
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SleepLogListProps {
  /** ログ一覧 */
  logs: SleepLogEntry[];
  /** 編集ボタン押下時（未指定なら編集ボタン非表示） */
  onEditRequest?: (log: SleepLogEntry) => void;
}

/** 気分アイコン */
const getMoodEmoji = (mood: number | null): string => {
  if (mood === null) return '–';
  const emojis: Record<number, string> = {
    1: '😫',
    2: '😟',
    3: '😐',
    4: '🙂',
    5: '😊',
  };
  return emojis[mood] ?? '–';
};

/** 気分テキスト */
const getMoodLabel = (mood: number | null): string => {
  if (mood === null) return '未記録';
  const labels: Record<number, string> = {
    1: 'とても悪い',
    2: '悪い',
    3: 'ふつう',
    4: '良い',
    5: 'とても良い',
  };
  return labels[mood] ?? '未記録';
};

/** 就寝日 (YYYY-MM-DD) を起床日に変換してフォーマット (2025-02-20 → 2/21 金) */
const formatWakeDate = (bedDateStr: string): string => {
  const wakeDateStr = addDaysToDateString(bedDateStr, 1);
  const [y, m, d] = wakeDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()} (${weekDays[date.getDay()]})`;
};

/** スコアに応じた色 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/**
 * 睡眠ログ一覧コンポーネント
 * FlatList → map に変更し ScrollView 内ネスト問題を解消
 */
export const SleepLogList: React.FC<SleepLogListProps> = ({ logs, onEditRequest }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Text style={styles.emptyEmoji}>😴</Text>
        </View>
        <Text style={styles.emptyText}>まだ記録がありません</Text>
        <Text style={styles.emptyHint}>
          睡眠モニターや照度センサーで{'\n'}就寝準備を記録すると{'\n'}ここに表示されます
        </Text>
      </View>
    );
  }

  const handlePress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.listContent}>
      {logs.map(item => {
        const isExpanded = expandedId === item.id;
        const scoreColor = getScoreColor(item.score);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handlePress(item.id)}
            style={[styles.logCard, { borderLeftColor: scoreColor }]}
          >
            {/* ヘッダー行 */}
            <View style={styles.logHeader}>
              <View style={styles.dateRow}>
                <Text style={styles.logDate}>{formatWakeDate(item.date)}</Text>
                <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.logScore, { color: scoreColor }]}>{item.score}</Text>
                <Text style={styles.scoreUnit}>点</Text>
                <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>
            </View>

            {/* タグ行 */}
            <View style={styles.tagsContainer}>
              {(item.usageMinutes > 0 || item.usagePenalty > 0) && (
                <View style={styles.tagPenalty}>
                  <Text style={styles.tagText}>
                    📱 {item.usageMinutes > 0 ? `${item.usageMinutes}分` : 'スマホ'}
                  </Text>
                </View>
              )}
              {item.lightExceeded && (
                <View style={styles.tagPenalty}>
                  <Text style={styles.tagText}>💡 光</Text>
                </View>
              )}
              {item.noiseExceeded && (
                <View style={styles.tagPenalty}>
                  <Text style={styles.tagText}>🔊 音</Text>
                </View>
              )}
              {!item.usageMinutes && !item.usagePenalty && !item.lightExceeded && !item.noiseExceeded && (
                <View style={styles.tagSuccess}>
                  <Text style={styles.tagTextSuccess}>✨ 完璧</Text>
                </View>
              )}
            </View>

            {/* 展開時の詳細 */}
            {isExpanded && (
              <View style={styles.detailContainer}>
                <View style={styles.divider} />

                {/* スマホ使用時間 */}
                {(item.usageMinutes > 0 || item.usagePenalty > 0) && (
                  <>
                    <Text style={styles.detailSectionTitle}>スマホ使用時間</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📱 使用時間</Text>
                      <Text style={[styles.detailValue, item.usagePenalty > 0 && { color: COLORS.error }]}>
                        {item.usageMinutes > 0 ? `${item.usageMinutes}分` : '–'}
                        {item.usagePenalty > 0 ? `  （減点 −${item.usagePenalty}）` : ''}
                      </Text>
                    </View>
                  </>
                )}

                {/* スコア内訳（環境） */}
                <Text style={[styles.detailSectionTitle, { marginTop: item.usageMinutes || item.usagePenalty ? 12 : 0 }]}>
                  スコア内訳
                </Text>
                {item.environmentPenalty > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🌙 環境（光・音）</Text>
                    <Text style={[styles.detailValue, { color: COLORS.error }]}>
                      −{item.environmentPenalty}
                    </Text>
                  </View>
                )}

                {item.usagePenalty === 0 && item.environmentPenalty === 0 && (
                  <Text style={styles.perfectText}>✨ 減点なし！完璧です</Text>
                )}

                {/* 気分 */}
                <Text style={[styles.detailSectionTitle, { marginTop: 12 }]}>朝の気分</Text>
                <View style={styles.moodDetailRow}>
                  <Text style={styles.moodDetailEmoji}>{getMoodEmoji(item.mood)}</Text>
                  <Text style={styles.moodDetailLabel}>{getMoodLabel(item.mood)}</Text>
                </View>

                {onEditRequest && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEditRequest(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editButtonText}>✏️ 編集</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  logCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logDate: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.dark,
  },
  moodEmoji: {
    fontSize: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  logScore: {
    fontSize: 29,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 15,
    color: '#64748B',
    marginRight: 8,
  },
  chevron: {
    fontSize: 11,
    color: '#64748B',
  },
  chevronExpanded: {
    color: COLORS.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPenalty: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBonus: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  tagTextSuccess: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },

  // 展開時の詳細スタイル
  detailContainer: {
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  detailValue: {
    fontSize: 21,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  perfectText: {
    color: COLORS.success,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
    paddingVertical: 4,
  },
  warningRow: {
    flexDirection: 'row',
    gap: 8,
  },
  warningBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  warningActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningInactive: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningTextActive: {
    color: COLORS.warning,
  },
  warningTextInactive: {
    color: '#FFFFFF',
  },
  moodDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  moodDetailEmoji: {
    fontSize: 31,
  },
  moodDetailLabel: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
