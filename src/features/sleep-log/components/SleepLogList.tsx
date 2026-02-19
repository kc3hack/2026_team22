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
import type { SleepLogEntry } from '../types';

// Android で LayoutAnimation を有効化
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SleepLogListProps {
  /** ログ一覧 */
  logs: SleepLogEntry[];
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
export const SleepLogList: React.FC<SleepLogListProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>
          まだ睡眠ログがありません
        </Text>
        <Text style={styles.emptyHint}>
          睡眠モニターを使って就寝準備を記録しましょう
        </Text>
      </View>
    );
  }

  const handlePress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.listContent}>
      {logs.map((item) => {
        const isExpanded = expandedId === item.id;
        const scoreColor = getScoreColor(item.score);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handlePress(item.id)}
            style={[
              styles.logCard,
              { borderLeftColor: scoreColor },
            ]}
          >
            {/* ヘッダー行 */}
            <View style={styles.logHeader}>
              <View style={styles.dateRow}>
                <Text style={styles.logDate}>
                  {item.date}
                </Text>
                <Text style={styles.moodEmoji}>
                  {getMoodEmoji(item.mood)}
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text
                  style={[
                    styles.logScore,
                    { color: scoreColor },
                  ]}
                >
                  {item.score}
                </Text>
                <Text style={styles.scoreUnit}>点</Text>
                <Text style={styles.chevron}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>
            </View>

            {/* タグ行 */}
            <View style={styles.tagsContainer}>
              {item.bonus > 0 && (
                <View style={styles.tagBonus}>
                  <Text style={styles.tagText}>
                    ⭐ ボーナス
                  </Text>
                </View>
              )}
              {item.usagePenalty > 0 && (
                <View style={styles.tagPenalty}>
                  <Text style={styles.tagText}>
                    📱 スマホ
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
              {!item.bonus &&
                !item.usagePenalty &&
                !item.lightExceeded &&
                !item.noiseExceeded && (
                  <View style={styles.tagSuccess}>
                    <Text style={styles.tagTextSuccess}>
                      ✨ 完璧
                    </Text>
                  </View>
                )}
            </View>

            {/* 展開時の詳細 */}
            {isExpanded && (
              <View style={styles.detailContainer}>
                <View style={styles.divider} />

                {/* スコア内訳 */}
                <Text style={styles.detailSectionTitle}>
                  スコア内訳
                </Text>
                {item.usagePenalty > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      📱 スマホ使用
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: COLORS.error },
                      ]}
                    >
                      −{item.usagePenalty}
                    </Text>
                  </View>
                )}
                {item.environmentPenalty > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      🌙 環境（光・音）
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: COLORS.error },
                      ]}
                    >
                      −{item.environmentPenalty}
                    </Text>
                  </View>
                )}
                {item.bonus > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      ⭐ ボーナス
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: COLORS.success },
                      ]}
                    >
                      +{item.bonus}
                    </Text>
                  </View>
                )}
                {item.usagePenalty === 0 &&
                  item.environmentPenalty === 0 &&
                  item.bonus === 0 && (
                    <Text style={styles.perfectText}>
                      ✨ 減点なし！完璧です
                    </Text>
                  )}

                {/* 警告情報 */}
                <Text
                  style={[
                    styles.detailSectionTitle,
                    { marginTop: 12 },
                  ]}
                >
                  警告履歴
                </Text>
                <View style={styles.warningRow}>
                  <View
                    style={[
                      styles.warningBadge,
                      item.phase1Warning
                        ? styles.warningActive
                        : styles.warningInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.warningText,
                        item.phase1Warning
                          ? styles.warningTextActive
                          : styles.warningTextInactive,
                      ]}
                    >
                      Phase1
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.warningBadge,
                      item.phase2Warning
                        ? styles.warningActive
                        : styles.warningInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.warningText,
                        item.phase2Warning
                          ? styles.warningTextActive
                          : styles.warningTextInactive,
                      ]}
                    >
                      Phase2
                    </Text>
                  </View>
                </View>

                {/* 気分 */}
                <Text
                  style={[
                    styles.detailSectionTitle,
                    { marginTop: 12 },
                  ]}
                >
                  朝の気分
                </Text>
                <View style={styles.moodDetailRow}>
                  <Text style={styles.moodDetailEmoji}>
                    {getMoodEmoji(item.mood)}
                  </Text>
                  <Text style={styles.moodDetailLabel}>
                    {getMoodLabel(item.mood)}
                  </Text>
                </View>
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 62,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 18,
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
    borderLeftWidth: 4,
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
    fontSize: 19,
    fontWeight: '600',
    color: COLORS.text.dark,
  },
  moodEmoji: {
    fontSize: 21,
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
    fontSize: 16,
    color: '#94A3B8',
    marginRight: 6,
  },
  chevron: {
    fontSize: 13,
    color: '#64748B',
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
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'uppercase',
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
});
