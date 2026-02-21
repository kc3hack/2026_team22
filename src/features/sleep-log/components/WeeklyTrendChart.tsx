import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  DimensionValue,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { COLORS } from '@shared/constants';
import type { SleepLogEntry } from '../types';

// Android で LayoutAnimation を有効化
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WeeklyTrendChartProps {
  logs: SleepLogEntry[];
}

/** スコアに応じた色 */
const getBarColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/** スコアに応じた背景色（バッジ用） */
const getBadgeBgColor = (score: number): string => {
  if (score >= 80) return 'rgba(16, 185, 129, 0.18)';
  if (score >= 50) return 'rgba(245, 158, 11, 0.18)';
  return 'rgba(239, 68, 68, 0.18)';
};

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ logs }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 過去7日分を古い順に表示
  const recentLogs = logs.slice(0, 7).reverse();

  // 週間平均スコア
  const avgScore =
    recentLogs.length > 0
      ? Math.round(recentLogs.reduce((sum, l) => sum + l.score, 0) / recentLogs.length)
      : 0;

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getDate()}日\n${days[date.getDay()]}`;
  };

  const handleBarPress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>週間トレンド</Text>
        <View style={[styles.avgBadge, { backgroundColor: getBadgeBgColor(avgScore) }]}>
          <Text style={styles.avgLabel}>平均</Text>
          <Text style={[styles.avgValue, { color: getBarColor(avgScore) }]}>{avgScore}点</Text>
        </View>
      </View>

      {/* チャート */}
      <View style={styles.chartContainer}>
        {recentLogs.map(log => {
          const heightPercent = `${Math.max(log.score, 8)}%` as DimensionValue;
          const isSelected = selectedId === log.id;
          const barColor = getBarColor(log.score);

          return (
            <TouchableOpacity
              key={log.id}
              style={styles.barColumn}
              onPress={() => handleBarPress(log.id)}
              activeOpacity={0.7}
            >
              {/* スコアラベル（選択時表示） */}
              <View style={styles.scoreLabelWrapper}>
                {isSelected && (
                  <View style={[styles.scoreBubble, { backgroundColor: barColor }]}>
                    <Text style={styles.scoreBubbleText}>{log.score}</Text>
                  </View>
                )}
              </View>

              {/* バー */}
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: heightPercent,
                      backgroundColor: barColor,
                      opacity: selectedId ? (isSelected ? 1 : 0.35) : 0.85,
                    },
                  ]}
                />
              </View>

              {/* 日付 */}
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {getDayLabel(log.date)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {recentLogs.length === 0 && <Text style={styles.noDataText}>データがありません</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.dark,
    letterSpacing: 0.2,
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  avgLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  avgValue: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabelWrapper: {
    height: 28,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreBubbleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  barWrapper: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 8,
    minHeight: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  dayLabelSelected: {
    color: COLORS.text.dark,
    fontWeight: '600',
  },
  moodEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  noDataText: {
    color: '#94A3B8',
    width: '100%',
    textAlign: 'center',
    paddingBottom: 40,
  },
});
