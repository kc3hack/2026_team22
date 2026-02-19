import React, { useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Animated,
    Easing,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepPlanStore } from './sleepPlanStore';
import { WeeklyPlanCard } from './components/WeeklyPlanCard';
import { PlanStatus } from './components/PlanStatus';

/**
 * 週間睡眠プラン画面 — Cosmic Sleep デザイン
 * AIが生成した7日分の睡眠プランを美しく表示
 */
export const SleepPlanScreen: React.FC = () => {
    const { plan, isLoading, error, fetchPlan } = useSleepPlanStore();
    const [refreshing, setRefreshing] = React.useState(false);

    // アニメーション
    const moonFloat = useRef(new Animated.Value(0)).current;
    const headerFade = useRef(new Animated.Value(0)).current;
    const contentFade = useRef(new Animated.Value(0)).current;

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

    // ヘッダーアニメーション
    useEffect(() => {
        // 月の浮遊アニメーション
        Animated.loop(
            Animated.sequence([
                Animated.timing(moonFloat, {
                    toValue: -8,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(moonFloat, {
                    toValue: 0,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // ヘッダーフェードイン
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [moonFloat, headerFade]);

    // コンテンツフェードイン
    useEffect(() => {
        if (plan) {
            Animated.timing(contentFade, {
                toValue: 1,
                duration: 600,
                delay: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [plan, contentFade]);

    /** プルダウンリフレッシュ */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPlan(true);
        setRefreshing(false);
    }, [fetchPlan]);

    // ローディング / エラー表示
    if (!plan && (isLoading || error)) {
        return (
            <SafeAreaView style={styles.container}>
                {/* 背景装飾 */}
                <View style={styles.bgStars}>
                    {[...Array(8)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.star,
                                {
                                    top: `${8 + i * 10}%`,
                                    right: `${5 + (i % 4) * 22}%`,
                                    opacity: 0.15 + (i % 3) * 0.1,
                                    width: 2 + (i % 3),
                                    height: 2 + (i % 3),
                                },
                            ]}
                        />
                    ))}
                </View>
                <Animated.View style={[styles.header, { opacity: headerFade }]}>
                    <View style={styles.titleRow}>
                        <Animated.Text
                            style={[styles.moonIcon, { transform: [{ translateY: moonFloat }] }]}
                        >
                            🌙
                        </Animated.Text>
                        <Text style={styles.title}>週間睡眠プラン</Text>
                    </View>
                </Animated.View>
                <PlanStatus isLoading={isLoading} error={error} onRetry={() => void fetchPlan(true)} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* 背景装飾 */}
            <View style={styles.bgStars}>
                {[...Array(8)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.star,
                            {
                                top: `${8 + i * 10}%`,
                                right: `${5 + (i % 4) * 22}%`,
                                opacity: 0.15 + (i % 3) * 0.1,
                                width: 2 + (i % 3),
                                height: 2 + (i % 3),
                            },
                        ]}
                    />
                ))}
            </View>

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
                {/* ── ヘッダー ── */}
                <Animated.View style={[styles.header, { opacity: headerFade }]}>
                    <View style={styles.titleRow}>
                        <Animated.Text
                            style={[styles.moonIcon, { transform: [{ translateY: moonFloat }] }]}
                        >
                            🌙
                        </Animated.Text>
                        <View>
                            <Text style={styles.title}>週間睡眠プラン</Text>
                            <Text style={styles.subtitle}>AIがあなたの予定に合わせて最適化</Text>
                        </View>
                    </View>

                    {/* キャッシュバッジ */}
                    {plan && (
                        <View style={styles.metaBadge}>
                            <Text style={styles.metaEmoji}>
                                {plan.cacheHit ? '♻️' : '✨'}
                            </Text>
                            <Text style={styles.metaText}>
                                {plan.cacheHit ? 'キャッシュ' : '新規生成'}
                                {' · '}
                                {new Date(plan.createdAt).toLocaleDateString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* ── 全日程一覧 ── */}
                <Animated.View style={{ opacity: contentFade }}>
                    {plan && (
                        <View style={styles.allPlansSection}>
                            <Text style={styles.sectionTitle}>📋 1週間の概要</Text>
                            <Text style={styles.sectionSubtitle}>
                                タップで詳細を確認できます
                            </Text>
                            {plan.dailyPlans.map((p, i) => (
                                <WeeklyPlanCard
                                    key={p.date}
                                    plan={p}
                                    isToday={p.date === todayStr}
                                    index={i}
                                />
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E293B',
    },
    bgStars: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 60,
    },
    // Header
    header: {
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    moonIcon: {
        fontSize: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text.dark,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
        marginTop: 4,
    },
    metaEmoji: {
        fontSize: 12,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    // All plans
    allPlansSection: {
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text.dark,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 14,
    },
});
