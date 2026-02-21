import React, { useEffect, useRef, useState } from 'react';
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
import { googleCalendar, type CalendarEvent } from '@shared/lib/googleCalendar';

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



/** 睡眠時間の評価テキスト */
const sleepEvaluation = (hours: number): { text: string; emoji: string; color: string } => {
  if (hours >= 8) return { text: '理想的な睡眠時間です', emoji: '🌟', color: COLORS.success };
  if (hours >= 7) return { text: '十分な睡眠時間です', emoji: '✅', color: COLORS.success };
  if (hours >= 6.5)
    return { text: 'やや短めですが許容範囲です', emoji: '⚠️', color: COLORS.warning };
  return { text: '睡眠不足です。体調に注意しましょう', emoji: '🚨', color: COLORS.error };
};

/** 重要度の詳細解説 */
const importanceDetail = (
  importance: DailyPlan['importance'],
  nextDayEvent?: string
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
        description:
          '翌日は特に重要な予定がありません。リラックスして自然な眠気を待てる日です。ただし生活リズムを崩しすぎないようにしましょう。',
        color: '#34D399',
        bg: 'rgba(16, 185, 129, 0.1)',
      };
  }
};

const formatTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatEventTimeRange = (event: CalendarEvent): string => {
  if (event.allDay) return '終日';
  return `${formatTime(event.start)} - ${formatTime(event.end)}`;
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
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

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

      // Fetch calendar events for the selected day
      const fetchEvents = async () => {
        setIsLoadingEvents(true);
        try {
          const [year, month, day] = plan.date.split('-').map(Number);
          if (year !== undefined && month !== undefined && day !== undefined) {
            const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59);
            const events = await googleCalendar.getEvents(startOfDay, endOfDay);
            // 翌日の予定なども含まれることがあるため、この日の予定だけにフィルタリング
            const filtered = events.filter(e => {
              const eStart = e.start.getTime();
              const eEnd = e.end.getTime();
              const dayStart = startOfDay.getTime();
              const dayEnd = endOfDay.getTime();
              // イベントがこの日の範囲に一部でも被っているか
              return eStart <= dayEnd && eEnd >= dayStart;
            });
            // 開始時刻順にソート
            filtered.sort((a, b) => a.start.getTime() - b.start.getTime());
            setDayEvents(filtered);
          }
        } catch (error) {
          console.error('Failed to fetch day schedule:', error);
        } finally {
          setIsLoadingEvents(false);
        }
      };

      fetchEvents();
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

  const evaluation = sleepEvaluation(plan.sleepDurationHours);
  const impDetail = importanceDetail(plan.importance, plan.nextDayEvent);
  const goalHours = 8;
  const goalRatio = Math.min(plan.sleepDurationHours / goalHours, 1);

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      {/* 背景オーバーレイ */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
      </Animated.View>

      {/* ボトムシート */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
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
              <Text style={styles.headerDate}>{plan.date.replace(/-/g, '/')}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── 睡眠スケジュールと評価 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌙 睡眠スケジュールと評価</Text>

            <View style={styles.combinedCard}>
              {/* スケジュール部分 */}
              <View style={styles.scheduleContainer}>
                <View style={styles.timeDetailBlock}>
                  <Text style={styles.timeDetailLabel}>就寝</Text>
                  <Text style={styles.timeDetailValue}>{plan.recommendedSleepTime}</Text>
                </View>
                <View style={styles.timeDetailArrow}>
                  <Text style={styles.timeDetailArrowIcon}>→</Text>
                </View>
                <View style={styles.timeDetailBlock}>
                  <Text style={styles.timeDetailLabel}>起床</Text>
                  <Text style={styles.timeDetailValue}>{plan.recommendedWakeTime}</Text>
                </View>
              </View>

              {/* 区切り線 */}
              <View style={styles.divider} />

              {/* 評価部分 */}
              <View style={styles.evalContainer}>
                <View style={styles.evalHeader}>
                  <View style={styles.evalHoursWrapper}>
                    <Text style={styles.evalEmoji}>{evaluation.emoji}</Text>
                    <Text style={styles.evalHours}>
                      {plan.sleepDurationHours}
                      <Text style={styles.evalUnit}> 時間</Text>
                    </Text>
                  </View>
                  <View style={styles.goalChip}>
                    <Text style={styles.evalGoal}>目標: {goalHours}時間</Text>
                  </View>
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

                <Text style={[styles.evalMessage, { color: evaluation.color }]}>
                  {evaluation.text}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 重要度の理由 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ 翌日の重要度</Text>
            <View
              style={[
                styles.importanceCard,
                { backgroundColor: impDetail.bg, borderColor: impDetail.color + '30' },
              ]}
            >
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

          {/* ── 1日の予定タイムライン ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 1日の予定</Text>
            <View style={styles.scheduleTimelineCard}>
              {isLoadingEvents ? (
                <View style={styles.emptyScheduleContainer}>
                  <Text style={styles.emptyScheduleText}>予定を取得中...</Text>
                </View>
              ) : dayEvents.length === 0 ? (
                <View style={styles.emptyScheduleContainer}>
                  <Text style={styles.emptyScheduleIcon}>☕️</Text>
                  <Text style={styles.emptyScheduleText}>この日の予定はありません</Text>
                  <Text style={styles.emptyScheduleSubText}>ゆっくりリラックスできる1日です</Text>
                </View>
              ) : (
                <View style={styles.timeline}>
                  {dayEvents.map((event, i) => (
                    <View key={event.id || `event-${i}`} style={styles.timelineItem}>
                      {/* 縦線 */}
                      {i < dayEvents.length - 1 && <View style={styles.timelineLine} />}
                      <View style={styles.timelineDot}>
                        <View style={styles.timelineInnerDot} />
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineTime}>{formatEventTimeRange(event)}</Text>
                        </View>
                        <Text style={styles.timelineTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        {event.description && (
                          <Text style={styles.timelineDesc} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: 0.5,
  },
  headerDate: {
    fontSize: 16,
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
    fontSize: 21,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text.dark,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // ── 睡眠スケジュールと評価の一体型カード ──
  combinedCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    overflow: 'hidden',
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  timeDetailBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeDetailLabel: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timeDetailValue: {
    fontSize: 44,
    fontWeight: '300',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timeDetailArrow: {
    paddingHorizontal: 8,
  },
  timeDetailArrowIcon: {
    fontSize: 28,
    color: 'rgba(99, 102, 241, 0.4)',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    marginHorizontal: 20,
  },
  evalContainer: {
    padding: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  evalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  evalHoursWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  evalEmoji: {
    fontSize: 26,
  },
  evalHours: {
    fontSize: 38,
    fontWeight: '300',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  evalUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: '#94A3B8',
  },
  goalChip: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  evalGoal: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  evalBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  evalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  evalMessage: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
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
    fontSize: 19,
    fontWeight: '700',
  },
  importanceDesc: {
    fontSize: 17,
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
    fontSize: 26,
  },
  eventCardContent: {
    flex: 1,
    gap: 4,
  },
  eventCardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text.dark,
  },
  eventCardSub: {
    fontSize: 16,
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
    fontSize: 18,
    color: '#CBD5E1',
    lineHeight: 24,
  },

  // ── 1日の予定タイムライン ──
  scheduleTimelineCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
  },
  emptyScheduleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyScheduleIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyScheduleText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 4,
  },
  emptyScheduleSubText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -20,
    width: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 2,
    zIndex: 1,
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTime: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.dark,
    lineHeight: 24,
  },
  timelineDesc: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 20,
    marginTop: 4,
  },
});
