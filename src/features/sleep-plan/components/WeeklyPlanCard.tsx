import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import type { DailyPlan } from '../types';

interface WeeklyPlanCardProps {
    /** プランデータ */
    plan: DailyPlan;
    /** 今日のプランかどうか */
    isToday?: boolean;
}

/**
 * 1日分の睡眠プランカード
 * 就寝/起床時刻、重要度、アドバイスを表示
 */
export const WeeklyPlanCard: React.FC<WeeklyPlanCardProps> = ({ plan, isToday = false }) => {
    const importanceBadge = {
        high: { label: '重要', color: COLORS.error, bg: 'rgba(239, 68, 68, 0.15)' },
        medium: { label: '普通', color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)' },
        low: { label: '軽め', color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)' },
    }[plan.importance];

    return (
        <View style={[styles.card, isToday && styles.todayCard]}>
            {/* ヘッダー: 日付 + 重要度 */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Text style={[styles.dayOfWeek, isToday && styles.todayText]}>
                        {plan.dayOfWeek}
                    </Text>
                    <Text style={[styles.date, isToday && styles.todayText]}>
                        {plan.date.slice(5).replace('-', '/')}
                    </Text>
                    {isToday && (
                        <View style={styles.todayBadge}>
                            <Text style={styles.todayBadgeText}>今日</Text>
                        </View>
                    )}
                </View>
                <View style={[styles.importanceBadge, { backgroundColor: importanceBadge.bg }]}>
                    <Text style={[styles.importanceText, { color: importanceBadge.color }]}>
                        {importanceBadge.label}
                    </Text>
                </View>
            </View>

            {/* 時刻表示 */}
            <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>就寝</Text>
                    <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
                        {plan.recommendedSleepTime}
                    </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>起床</Text>
                    <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
                        {plan.recommendedWakeTime}
                    </Text>
                </View>
                <View style={styles.durationBlock}>
                    <Text style={styles.durationValue}>{plan.sleepDurationHours}h</Text>
                </View>
            </View>

            {/* 翌日の予定 */}
            {plan.nextDayEvent && (
                <View style={styles.eventRow}>
                    <Text style={styles.eventIcon}>📅</Text>
                    <Text style={styles.eventText} numberOfLines={1}>
                        {plan.nextDayEvent}
                    </Text>
                </View>
            )}

            {/* アドバイス */}
            <Text style={styles.advice} numberOfLines={2}>
                💡 {plan.advice}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    todayCard: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dayOfWeek: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text.dark,
    },
    date: {
        fontSize: 14,
        color: '#94A3B8',
    },
    todayText: {
        color: COLORS.primary,
    },
    todayBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    todayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    importanceBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    importanceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    timeBlock: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 24,
        fontWeight: '300',
        color: COLORS.text.dark,
        fontVariant: ['tabular-nums'],
    },
    todayTimeValue: {
        color: COLORS.primary,
        fontWeight: '400',
    },
    arrow: {
        fontSize: 16,
        color: '#475569',
        marginTop: 12,
    },
    durationBlock: {
        backgroundColor: '#1E293B',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 12,
    },
    durationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    eventIcon: {
        fontSize: 12,
    },
    eventText: {
        fontSize: 13,
        color: '#94A3B8',
        flex: 1,
    },
    advice: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
        paddingHorizontal: 4,
    },
});
