import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { COLORS } from '@shared/constants';
import type { DailyPlan } from '../types';

interface DayDetailModalProps {
    /** 表示するプラン */
    plan: DailyPlan | null;
    /** 全日プラン（前日比較用） */
    allPlans: DailyPlan[];
    /** 選択中のインデックス */
    selectedIndex: number;
    /** モーダルを閉じるコールバック */
    onClose: () => void;
}

/** 時刻文字列 (HH:mm) を分に変換 */
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
};

/** 分を HH:mm に変換 */
const minutesToTime = (minutes: number): string => {
    const m = ((minutes % 1440) + 1440) % 1440; // wrap around
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
};

/** 時刻差分のテキスト */
const timeDiffText = (current: string, previous: string): string | null => {
    const diff = timeToMinutes(current) - timeToMinutes(previous);
    if (diff === 0) return null;
    const absDiff = Math.abs(diff);
    const hh = Math.floor(absDiff / 60);
    const mm = absDiff % 60;
    const label = hh > 0 ? `${hh}時間${mm > 0 ? `${mm}分` : ''}` : `${mm}分`;
    return diff > 0 ? `前日より${label}遅い` : `前日より${label}早い`;
};

/** 睡眠時間の評価テキスト */
const sleepEvaluation = (hours: number): { text: string; emoji: string; color: string } => {
    if (hours >= 8) return { text: '理想的な睡眠時間です', emoji: '🌟', color: COLORS.success };
    if (hours >= 7) return { text: '十分な睡眠時間です', emoji: '✅', color: COLORS.success };
    if (hours >= 6.5) return { text: 'やや短めですが許容範囲です', emoji: '⚠️', color: COLORS.warning };
    return { text: '睡眠不足です。体調に注意しましょう', emoji: '🚨', color: COLORS.error };
};

/** 重要度の詳細解説 */
const importanceDetail = (
    importance: DailyPlan['importance'],
    nextDayEvent?: string,
): { title: string; description: string; color: string; bg: string } => {
    const eventText = nextDayEvent ? `「${nextDayEvent}」` : '予定';
    switch (importance) {
        case 'high':
            return {
                title: '高い重要度',
                description: `翌日に${eventText}が控えています。十分な睡眠で万全の状態を整えましょう。パフォーマンスに直結する睡眠を確保することが大切です。`,
                color: '#F87171',
                bg: 'rgba(239, 68, 68, 0.1)',
            };
        case 'medium':
            return {
                title: '通常の重要度',
                description: `翌日は${eventText}があります。通常通りの睡眠で十分対応できますが、規則正しい就寝を心がけましょう。`,
                color: '#FBBF24',
                bg: 'rgba(245, 158, 11, 0.1)',
            };
        case 'low':
            return {
                title: '低い重要度',
                description: '翌日は特に重要な予定がありません。リラックスして自然な眠気を待てる日です。ただし生活リズムを崩しすぎないようにしましょう。',
                color: '#34D399',
                bg: 'rgba(16, 185, 129, 0.1)',
            };
    }
};

/** 就寝準備タイムライン生成 */
const generatePrepTimeline = (
    sleepTime: string,
): { time: string; label: string; icon: string; description: string }[] => {
    const sleepMinutes = timeToMinutes(sleepTime);
    return [
        {
            time: minutesToTime(sleepMinutes - 60),
            label: '1時間前',
            icon: '📱',
            description: 'スマホ・PCの使用を控え、ブルーライトを避けましょう',
        },
        {
            time: minutesToTime(sleepMinutes - 30),
            label: '30分前',
            icon: '🛀',
            description: 'ぬるめのお風呂やストレッチでリラックスしましょう',
        },
        {
            time: minutesToTime(sleepMinutes - 15),
            label: '15分前',
            icon: '🌙',
            description: '照明を暗くし、リラックスできる環境を整えましょう',
        },
        {
            time: sleepTime,
            label: '就寝',
            icon: '😴',
            description: '目を閉じて、ゆっくり深呼吸を繰り返しましょう',
        },
    ];
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 曜日の詳細情報を表示するボトムシート風モーダル
 */
export const DayDetailModal: React.FC<DayDetailModalProps> = ({
    plan,
    allPlans,
    selectedIndex,
    onClose,
}) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (plan) {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 25,
                    stiffness: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [plan, slideAnim, backdropAnim]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    if (!plan) return null;

    const prevPlan = selectedIndex > 0 ? allPlans[selectedIndex - 1] : null;
    const sleepDiff = prevPlan ? timeDiffText(plan.recommendedSleepTime, prevPlan.recommendedSleepTime) : null;
    const wakeDiff = prevPlan ? timeDiffText(plan.recommendedWakeTime, prevPlan.recommendedWakeTime) : null;
    const evaluation = sleepEvaluation(plan.sleepDurationHours);
    const impDetail = importanceDetail(plan.importance, plan.nextDayEvent);
    const prepTimeline = generatePrepTimeline(plan.recommendedSleepTime);
    const goalHours = 8;
    const goalRatio = Math.min(plan.sleepDurationHours / goalHours, 1);

    return (
        <Modal visible transparent animationType="none" onRequestClose={handleClose}>
            {/* 背景オーバーレイ */}
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />
            </Animated.View>

            {/* ボトムシート */}
            <Animated.View
                style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
            >
                {/* ドラッグハンドル */}
                <View style={styles.handleBar} />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* ── ヘッダー ── */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerDay}>{plan.dayOfWeek}曜日</Text>
                            <Text style={styles.headerDate}>
                                {plan.date.replace(/-/g, '/')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── 就寝・起床の詳細 ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🌙 就寝・起床スケジュール</Text>
                        <View style={styles.timeDetailRow}>
                            <View style={styles.timeDetailBlock}>
                                <Text style={styles.timeDetailLabel}>就寝</Text>
                                <Text style={styles.timeDetailValue}>
                                    {plan.recommendedSleepTime}
                                </Text>
                                {sleepDiff && (
                                    <Text style={styles.timeDiffText}>{sleepDiff}</Text>
                                )}
                            </View>
                            <View style={styles.timeDetailArrow}>
                                <Text style={styles.timeDetailArrowIcon}>→</Text>
                            </View>
                            <View style={styles.timeDetailBlock}>
                                <Text style={styles.timeDetailLabel}>起床</Text>
                                <Text style={styles.timeDetailValue}>
                                    {plan.recommendedWakeTime}
                                </Text>
                                {wakeDiff && (
                                    <Text style={styles.timeDiffText}>{wakeDiff}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ── 睡眠時間評価 ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 睡眠時間の評価</Text>
                        <View style={styles.evalCard}>
                            <View style={styles.evalHeader}>
                                <Text style={styles.evalHours}>
                                    {plan.sleepDurationHours}
                                    <Text style={styles.evalUnit}> 時間</Text>
                                </Text>
                                <Text style={styles.evalGoal}>
                                    目標: {goalHours}時間
                                </Text>
                            </View>
                            <View style={styles.evalBarTrack}>
                                <View
                                    style={[
                                        styles.evalBarFill,
                                        {
                                            width: `${goalRatio * 100}%`,
                                            backgroundColor: evaluation.color,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.evalMessageRow}>
                                <Text style={styles.evalEmoji}>{evaluation.emoji}</Text>
                                <Text style={[styles.evalMessage, { color: evaluation.color }]}>
                                    {evaluation.text}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── 重要度の理由 ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚡ 翌日の重要度</Text>
                        <View style={[styles.importanceCard, { backgroundColor: impDetail.bg, borderColor: impDetail.color + '30' }]}>
                            <View style={styles.importanceHeader}>
                                <View style={[styles.importanceDot, { backgroundColor: impDetail.color }]} />
                                <Text style={[styles.importanceTitle, { color: impDetail.color }]}>
                                    {impDetail.title}
                                </Text>
                            </View>
                            <Text style={styles.importanceDesc}>{impDetail.description}</Text>
                        </View>
                    </View>

                    {/* ── 翌日のスケジュール ── */}
                    {plan.nextDayEvent && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📅 翌日のスケジュール</Text>
                            <View style={styles.eventCard}>
                                <View style={styles.eventIconWrap}>
                                    <Text style={styles.eventCardIcon}>📋</Text>
                                </View>
                                <View style={styles.eventCardContent}>
                                    <Text style={styles.eventCardTitle}>{plan.nextDayEvent}</Text>
                                    <Text style={styles.eventCardSub}>
                                        しっかり睡眠を取って万全の状態で臨みましょう
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── AIアドバイス全文 ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💡 AIアドバイス</Text>
                        <View style={styles.adviceCard}>
                            <Text style={styles.adviceFullText}>{plan.advice}</Text>
                        </View>
                    </View>

                    {/* ── 就寝準備タイムライン ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🛏️ 就寝準備タイムライン</Text>
                        <View style={styles.timeline}>
                            {prepTimeline.map((step, i) => (
                                <View key={step.label} style={styles.timelineItem}>
                                    {/* 縦線 */}
                                    {i < prepTimeline.length - 1 && (
                                        <View style={styles.timelineLine} />
                                    )}
                                    <View style={styles.timelineDot}>
                                        <Text style={styles.timelineDotIcon}>{step.icon}</Text>
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <View style={styles.timelineHeader}>
                                            <Text style={styles.timelineTime}>{step.time}</Text>
                                            <Text style={styles.timelineLabel}>{step.label}</Text>
                                        </View>
                                        <Text style={styles.timelineDesc}>{step.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 下部スペーサー */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.88,
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderBottomWidth: 0,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(148, 163, 184, 0.4)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(51, 65, 85, 0.5)',
        marginBottom: 20,
    },
    headerLeft: {
        gap: 4,
    },
    headerDay: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text.dark,
        letterSpacing: 0.5,
    },
    headerDate: {
        fontSize: 15,
        color: '#94A3B8',
        fontWeight: '500',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },

    // ── Section ──
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text.dark,
        marginBottom: 12,
        letterSpacing: 0.3,
    },

    // ── 就寝・起床の詳細 ──
    timeDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.4)',
    },
    timeDetailBlock: {
        flex: 1,
        alignItems: 'center',
    },
    timeDetailLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 6,
    },
    timeDetailValue: {
        fontSize: 32,
        fontWeight: '300',
        color: COLORS.text.dark,
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    timeDiffText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '500',
        marginTop: 6,
    },
    timeDetailArrow: {
        paddingHorizontal: 12,
    },
    timeDetailArrowIcon: {
        fontSize: 20,
        color: 'rgba(99, 102, 241, 0.5)',
    },

    // ── 睡眠時間評価 ──
    evalCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.4)',
    },
    evalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    evalHours: {
        fontSize: 36,
        fontWeight: '300',
        color: COLORS.text.dark,
        fontVariant: ['tabular-nums'],
    },
    evalUnit: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94A3B8',
    },
    evalGoal: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    evalBarTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(51, 65, 85, 0.4)',
        overflow: 'hidden',
        marginBottom: 14,
    },
    evalBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    evalMessageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    evalEmoji: {
        fontSize: 16,
    },
    evalMessage: {
        fontSize: 14,
        fontWeight: '600',
    },

    // ── 重要度 ──
    importanceCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
    },
    importanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    importanceDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    importanceTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    importanceDesc: {
        fontSize: 13,
        color: '#CBD5E1',
        lineHeight: 21,
    },

    // ── 翌日スケジュール ──
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.4)',
    },
    eventIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventCardIcon: {
        fontSize: 20,
    },
    eventCardContent: {
        flex: 1,
        gap: 4,
    },
    eventCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text.dark,
    },
    eventCardSub: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
    },

    // ── AIアドバイス ──
    adviceCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    adviceFullText: {
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 24,
    },

    // ── 就寝準備タイムライン ──
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 19,
        top: 42,
        bottom: -16,
        width: 2,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    timelineDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.25)',
    },
    timelineDotIcon: {
        fontSize: 18,
    },
    timelineContent: {
        flex: 1,
        paddingTop: 2,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    timelineTime: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        fontVariant: ['tabular-nums'],
    },
    timelineLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    timelineDesc: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
    },
});
