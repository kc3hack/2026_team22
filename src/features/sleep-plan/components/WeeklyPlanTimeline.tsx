import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '@shared/constants';
import type { DailyPlan } from '../types';

interface WeeklyPlanTimelineProps {
    /** 7日分のプラン */
    plans: DailyPlan[];
    /** 選択中の日付 */
    selectedDate: string | null;
    /** 日付選択コールバック */
    onSelectDate: (date: string) => void;
}

/**
 * 横スクロール可能な7日分のタイムラインバー
 * 各日の重要度と就寝時刻をコンパクトに表示
 */
export const WeeklyPlanTimeline: React.FC<WeeklyPlanTimelineProps> = ({
    plans,
    selectedDate,
    onSelectDate,
}) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const importanceColor = {
        high: COLORS.error,
        medium: COLORS.warning,
        low: COLORS.success,
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {plans.map(plan => {
                    const isToday = plan.date === todayStr;
                    const isSelected = plan.date === selectedDate;
                    const dotColor = importanceColor[plan.importance];

                    return (
                        <TouchableOpacity
                            key={plan.date}
                            style={[
                                styles.dayItem,
                                isSelected && styles.dayItemSelected,
                                isToday && !isSelected && styles.dayItemToday,
                            ]}
                            onPress={() => onSelectDate(plan.date)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dayOfWeek, isSelected && styles.selectedText]}>
                                {plan.dayOfWeek}
                            </Text>
                            <Text style={[styles.dateNum, isSelected && styles.selectedText]}>
                                {plan.date.slice(8)}
                            </Text>
                            <View style={[styles.dot, { backgroundColor: dotColor }]} />
                            <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>
                                {plan.recommendedSleepTime}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 4,
        gap: 8,
    },
    dayItem: {
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        minWidth: 64,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    dayItemSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayItemToday: {
        borderColor: COLORS.primary,
    },
    dayOfWeek: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 4,
        fontWeight: '600',
    },
    dateNum: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text.dark,
        marginBottom: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
    },
    timeText: {
        fontSize: 11,
        color: '#64748B',
        fontVariant: ['tabular-nums'],
    },
    selectedText: {
        color: '#FFFFFF',
    },
    selectedTimeText: {
        color: 'rgba(255,255,255,0.8)',
    },
});
