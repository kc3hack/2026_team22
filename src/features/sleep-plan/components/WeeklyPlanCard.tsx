import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { COLORS } from '@shared/constants';
import type { DailyPlan } from '../types';

interface WeeklyPlanCardProps {
  /** プランデータ */
  plan: DailyPlan;
  /** 今日のプランかどうか */
  isToday?: boolean;
  /** カード表示順インデックス（アニメーション用） */
  index?: number;
  /** カードタップ時のコールバック */
  onPress?: () => void;
}

/** 睡眠時間バーの最大幅に対する比率計算 (6h=60%, 10h=100%) */
const sleepRatio = (hours: number): number => Math.min(Math.max((hours - 4) / 6, 0.1), 1);

/** 睡眠時間に応じた色 */
const durationColor = (hours: number): string => {
  if (hours >= 7.5) return COLORS.success;
  if (hours >= 6.5) return COLORS.warning;
  return COLORS.error;
};

/**
 * 1日分の睡眠プランカード — グラスモーフィズムデザイン
 */
export const WeeklyPlanCard: React.FC<WeeklyPlanCardProps> = ({
  plan,
  isToday = false,
  index = 0,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // staggered fade-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  useEffect(() => {
    if (isToday) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isToday, glowAnim]);

  const importanceBadge = {
    high: {
      label: '⚡ 重要',
      color: '#F87171',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    medium: {
      label: '● 普通',
      color: '#FBBF24',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    low: {
      label: '○ 軽め',
      color: '#34D399',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
  }[plan.importance];

  const barColor = durationColor(plan.sleepDurationHours);
  const barWidth = `${sleepRatio(plan.sleepDurationHours) * 100}%` as const;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={!onPress}>
      <Animated.View
        style={[
          styles.card,
          isToday && styles.todayCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* 今日グロー背景 */}
        {isToday && <Animated.View style={[styles.todayGlowBg, { opacity: glowAnim }]} />}

        {/* ── ヘッダー ── */}
        <View style={styles.header}>
          <View style={styles.dateArea}>
            <Text style={[styles.dayOfWeek, isToday && styles.todayAccent]}>{plan.dayOfWeek}</Text>
            <Text style={[styles.dateText, isToday && styles.todayAccentSub]}>
              {plan.date.slice(5).replace('-', '/')}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.importanceBadge,
              { backgroundColor: importanceBadge.bg, borderColor: importanceBadge.border },
            ]}
          >
            <Text style={[styles.importanceText, { color: importanceBadge.color }]}>
              {importanceBadge.label}
            </Text>
          </View>
        </View>

        {/* ── 時刻表示 ── */}
        <View style={styles.timeSection}>
          <View style={styles.timeBlock}>
            <View style={styles.timeLabelRow}>
              <Text style={styles.timeIcon}>🌙</Text>
              <Text style={styles.timeLabel}>就寝</Text>
            </View>
            <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
              {plan.recommendedSleepTime}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <View style={styles.arrowLine} />
            <Text style={styles.arrowHead}>›</Text>
          </View>

          <View style={styles.timeBlock}>
            <View style={styles.timeLabelRow}>
              <Text style={styles.timeIcon}>☀️</Text>
              <Text style={styles.timeLabel}>起床</Text>
            </View>
            <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
              {plan.recommendedWakeTime}
            </Text>
          </View>
        </View>

        {/* ── 睡眠時間バー ── */}
        <View style={styles.durationSection}>
          <View style={styles.durationHeader}>
            <Text style={styles.durationLabel}>睡眠時間</Text>
            <Text style={[styles.durationValue, { color: barColor }]}>
              {plan.sleepDurationHours}時間
            </Text>
          </View>
          <View style={styles.durationBarTrack}>
            <View
              style={[styles.durationBarFill, { width: barWidth, backgroundColor: barColor }]}
            />
          </View>
        </View>

        {/* ── 翌日の予定 ── */}
        {plan.nextDayEvent && (
          <View style={styles.eventRow}>
            <View style={styles.eventIconWrap}>
              <Text style={styles.eventIcon}>📅</Text>
            </View>
            <Text style={styles.eventText}>{plan.nextDayEvent}</Text>
          </View>
        )}

        {/* ── アドバイス ── */}
        <View style={styles.adviceSection}>
          <View style={styles.adviceLine} />
          <View style={styles.adviceContent}>
            <Text style={styles.adviceIcon}>💡</Text>
            <Text style={styles.adviceText} numberOfLines={2}>
              {plan.advice}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    position: 'relative',
    overflow: 'hidden',
  },
  todayCard: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  todayGlowBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayOfWeek: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  todayAccent: {
    color: COLORS.primary,
  },
  todayAccentSub: {
    color: 'rgba(99, 102, 241, 0.7)',
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  importanceBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  importanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Time
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timeIcon: {
    fontSize: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  todayTimeValue: {
    color: COLORS.primary,
    fontWeight: '400',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
  },
  arrowLine: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  arrowHead: {
    fontSize: 23,
    color: 'rgba(99, 102, 241, 0.5)',
    marginLeft: -2,
    fontWeight: '300',
  },
  // Duration bar
  durationSection: {
    marginBottom: 14,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  durationLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  durationBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    overflow: 'hidden',
  },
  durationBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Event
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  eventIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    fontSize: 17,
  },
  eventText: {
    fontSize: 17,
    color: '#CBD5E1',
    flex: 1,
    fontWeight: '500',
  },
  // Advice
  adviceSection: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 2,
  },
  adviceLine: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    marginTop: 2,
    marginBottom: 2,
  },
  adviceContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  adviceIcon: {
    fontSize: 17,
    marginTop: 1,
  },
  adviceText: {
    fontSize: 17,
    color: '#94A3B8',
    lineHeight: 20,
    flex: 1,
  },
});
