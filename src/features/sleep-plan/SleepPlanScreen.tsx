import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepPlanStore } from './sleepPlanStore';
import { WeeklyPlanTimeline } from './components/WeeklyPlanTimeline';
import { WeeklyPlanCard } from './components/WeeklyPlanCard';
import { PlanStatus } from './components/PlanStatus';

/**
 * 週間睡眠プラン画面
 * 朝のホーム表示時にAIが生成した7日分の睡眠プランを表示
 */
export const SleepPlanScreen: React.FC = () => {
    const { plan, isLoading, error, fetchPlan } = useSleepPlanStore();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // 今日の日付
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 初回取得
    useEffect(() => {
        void fetchPlan();
    }, [fetchPlan]);

    // プラン取得後、今日を初期選択
    useEffect(() => {
        if (plan && !selectedDate) {
            setSelectedDate(todayStr);
        }
    }, [plan, selectedDate, todayStr]);

    /** プルダウンリフレッシュ */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPlan(true);
        setRefreshing(false);
    }, [fetchPlan]);

    /** 選択中のプランデータ */
    const selectedPlan = plan?.dailyPlans.find(d => d.date === selectedDate) ?? null;

    // ローディング / エラー表示
    if (!plan && (isLoading || error)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>📋 週間睡眠プラン</Text>
                </View>
                <PlanStatus isLoading={isLoading} error={error} onRetry={() => void fetchPlan(true)} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => void handleRefresh()}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.title}>📋 週間睡眠プラン</Text>
                    <Text style={styles.subtitle}>AIがあなたの予定に合わせて最適化</Text>
                </View>

                {/* キャッシュ情報 */}
                {plan && (
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            {plan.cacheHit ? '♻️ キャッシュから取得' : '✨ 新規生成'}
                        </Text>
                        <Text style={styles.metaText}>
                            更新: {new Date(plan.createdAt).toLocaleDateString('ja-JP')}
                        </Text>
                    </View>
                )}

                {/* タイムライン */}
                {plan && (
                    <WeeklyPlanTimeline
                        plans={plan.dailyPlans}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                )}

                {/* 選択中のプラン詳細 */}
                {selectedPlan && (
                    <WeeklyPlanCard plan={selectedPlan} isToday={selectedPlan.date === todayStr} />
                )}

                {/* 全日程一覧 */}
                {plan && (
                    <View style={styles.allPlansSection}>
                        <Text style={styles.sectionTitle}>1週間の概要</Text>
                        {plan.dailyPlans.map(p => (
                            <WeeklyPlanCard key={p.date} plan={p} isToday={p.date === todayStr} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E293B',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.dark,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#475569',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.dark,
        marginBottom: 12,
        marginTop: 8,
    },
    allPlansSection: {
        marginTop: 8,
    },
});
