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
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WeeklyTrendChartProps {
    logs: SleepLogEntry[];
}

/** 気分アイコン */
const getMoodEmoji = (mood: number | null): string => {
    if (mood === null) return '–';
    const emojis: Record<number, string> = { 1: '😫', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' };
    return emojis[mood] ?? '–';
};

/** スコアに応じた色 */
const getBarColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
};

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ logs }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 過去7日分を古い順に表示
    const recentLogs = logs.slice(0, 7).reverse();

    // 週間平均スコア
    const avgScore =
        recentLogs.length > 0
            ? Math.round(
                recentLogs.reduce((sum, l) => sum + l.score, 0) /
                recentLogs.length,
            )
            : 0;

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return `${date.getDate()}日\n${days[date.getDay()]}`;
    };

    const handleBarPress = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedId((prev) => (prev === id ? null : id));
    };

    return (
        <View style={styles.container}>
            {/* ヘッダー */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>📈 週間トレンド</Text>
                <View style={styles.avgBadge}>
                    <Text style={styles.avgLabel}>平均</Text>
                    <Text
                        style={[
                            styles.avgValue,
                            { color: getBarColor(avgScore) },
                        ]}
                    >
                        {avgScore}点
                    </Text>
                </View>
            </View>

            {/* チャート */}
            <View style={styles.chartContainer}>
                {recentLogs.map((log) => {
                    const heightPercent =
                        `${Math.max(log.score, 8)}%` as DimensionValue;
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
                                    <View
                                        style={[
                                            styles.scoreBubble,
                                            { backgroundColor: barColor },
                                        ]}
                                    >
                                        <Text style={styles.scoreBubbleText}>
                                            {log.score}
                                        </Text>
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
                                            opacity: selectedId
                                                ? isSelected
                                                    ? 1
                                                    : 0.35
                                                : 0.85,
                                        },
                                    ]}
                                />
                            </View>

                            {/* 日付 */}
                            <Text
                                style={[
                                    styles.dayLabel,
                                    isSelected && styles.dayLabelSelected,
                                ]}
                            >
                                {getDayLabel(log.date)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {recentLogs.length === 0 && (
                    <Text style={styles.noDataText}>データがありません</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text.dark,
    },
    avgBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    avgLabel: {
        fontSize: 12,
        color: '#94A3B8',
    },
    avgValue: {
        fontSize: 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 190,
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
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
    },
    barWrapper: {
        height: 110,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: 20,
        borderRadius: 10,
        minHeight: 6,
    },
    dayLabel: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 6,
        textAlign: 'center',
        lineHeight: 14,
    },
    dayLabelSelected: {
        color: COLORS.text.dark,
        fontWeight: '600',
    },
    moodEmoji: {
        fontSize: 12,
        marginTop: 2,
    },
    noDataText: {
        color: '#94A3B8',
        width: '100%',
        textAlign: 'center',
        paddingBottom: 40,
    },
});
