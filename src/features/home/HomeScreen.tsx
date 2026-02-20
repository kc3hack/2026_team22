import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from '@features/sleep-settings';

import { useSleepLogStore } from '@features/sleep-log';

import { useSleepPlanStore } from '@features/sleep-plan';
import { useEffect } from 'react';
import { MorningReviewCard } from './components/MorningReviewCard';

/**
 * ホーム画面（ダッシュボード）
 * 今夜の就寝予定・モニタリング状態・最新スコア・今日の睡眠プランを表示
 */
export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const settings = useSleepSettingsStore();
  const { logs, setMood } = useSleepLogStore();
  const latestLog = logs[0] ?? null;
  const latestScore = latestLog?.score ?? null;
  const { plan, fetchPlan } = useSleepPlanStore();
  const todayPlan = useSleepPlanStore(state => state.getTodayPlan());

  // プランを取得（キャッシュ期限内ならスキップ）
  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  // オーバーライド考慮の有効な時刻
  const effectiveSleep = settings.getEffectiveSleepTime();
  const effectiveWake = settings.getEffectiveWakeTime();
  const sleepTimeStr = `${effectiveSleep.hour.toString().padStart(2, '0')}:${effectiveSleep.minute.toString().padStart(2, '0')}`;
  const wakeTimeStr = `${effectiveWake.hour.toString().padStart(2, '0')}:${effectiveWake.minute.toString().padStart(2, '0')}`;
  const isOverridden = settings.todayOverride !== null && settings.todayOverride.date === new Date().toISOString().slice(0, 10);

  // スケジュールカードの編集モード
  const [editingSchedule, setEditingSchedule] = useState(false);

  const adjustSleepHour = (delta: number) => {
    const newHour = (effectiveSleep.hour + delta + 24) % 24;
    settings.setTodayOverride({
      sleepHour: newHour,
      sleepMinute: effectiveSleep.minute,
      wakeHour: effectiveWake.hour,
      wakeMinute: effectiveWake.minute,
    });
  };
  const adjustSleepMinute = (delta: number) => {
    const newMinute = (effectiveSleep.minute + delta + 60) % 60;
    settings.setTodayOverride({
      sleepHour: effectiveSleep.hour,
      sleepMinute: newMinute,
      wakeHour: effectiveWake.hour,
      wakeMinute: effectiveWake.minute,
    });
  };
  const adjustWakeHour = (delta: number) => {
    const newHour = (effectiveWake.hour + delta + 24) % 24;
    settings.setTodayOverride({
      sleepHour: effectiveSleep.hour,
      sleepMinute: effectiveSleep.minute,
      wakeHour: newHour,
      wakeMinute: effectiveWake.minute,
    });
  };
  const adjustWakeMinute = (delta: number) => {
    const newMinute = (effectiveWake.minute + delta + 60) % 60;
    settings.setTodayOverride({
      sleepHour: effectiveSleep.hour,
      sleepMinute: effectiveSleep.minute,
      wakeHour: effectiveWake.hour,
      wakeMinute: newMinute,
    });
  };

  // 朝の振り返りカードの表示条件
  const showMorningReview = useMemo(() => {
    if (!latestLog || latestLog.mood !== null) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const wakeMinutes = settings.wakeUpHour * 60 + settings.wakeUpMinute;
    return currentMinutes >= wakeMinutes;
  }, [latestLog, settings.wakeUpHour, settings.wakeUpMinute]);

  const importanceColor = {
    high: COLORS.error,
    medium: COLORS.warning,
    low: COLORS.success,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>おやすみサポート</Text>
          <Text style={styles.subtitle}>良質な睡眠のための準備を</Text>
        </View>

        <View style={styles.content}>
          {/* 朝の振り返りカード */}
          {showMorningReview && latestLog && latestScore !== null && (
            <MorningReviewCard
              score={latestScore}
              onSelectMood={(mood) => setMood(latestLog.id, mood)}
            />
          )}



          {/* 今日の睡眠プラン (AIプラン) */}
          {todayPlan && (
            <TouchableOpacity
              style={styles.planCard}
              onPress={() => router.push('/sleep-plan' as never)}
            >
              <View style={styles.planCardHeader}>
                <Text style={styles.cardTitle}>✨ 今日のAIプラン</Text>
                <View
                  style={[
                    styles.importanceBadge,
                    {
                      backgroundColor:
                        todayPlan.importance === 'high'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : todayPlan.importance === 'medium'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[styles.importanceText, { color: importanceColor[todayPlan.importance] }]}
                  >
                    {todayPlan.importance === 'high'
                      ? '重要'
                      : todayPlan.importance === 'medium'
                        ? '普通'
                        : '軽め'}
                  </Text>
                </View>
              </View>
              <View style={styles.planTimeRow}>
                <View style={styles.planTimeItem}>
                  <Text style={styles.planTimeLabel}>推奨就寝</Text>
                  <Text style={styles.planTimeValue}>{todayPlan.recommendedSleepTime}</Text>
                </View>
                <Text style={styles.planArrow}>→</Text>
                <View style={styles.planTimeItem}>
                  <Text style={styles.planTimeLabel}>推奨起床</Text>
                  <Text style={styles.planTimeValue}>{todayPlan.recommendedWakeTime}</Text>
                </View>
              </View>
              {todayPlan.nextDayEvent && (
                <Text style={styles.planEventText}>📅 明日: {todayPlan.nextDayEvent}</Text>
              )}
              <Text style={styles.planAdvice} numberOfLines={2}>
                💡 {todayPlan.advice}
              </Text>
            </TouchableOpacity>
          )}

          {/* スケジュールカード */}
          <TouchableOpacity
            style={[styles.scheduleCard, isOverridden && styles.scheduleCardOverridden]}
            onPress={() => !editingSchedule && setEditingSchedule(true)}
            activeOpacity={editingSchedule ? 1 : 0.7}
          >
            <View style={styles.scheduleHeader}>
              <Text style={styles.cardTitle}>📅 今日のスケジュール</Text>
              {isOverridden && (
                <View style={styles.overrideBadge}>
                  <Text style={styles.overrideBadgeText}>変更あり</Text>
                </View>
              )}
            </View>

            {!editingSchedule && (
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>就寝</Text>
                  <Text style={styles.scheduleTime}>{sleepTimeStr}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>起床</Text>
                  <Text style={styles.scheduleTime}>{wakeTimeStr}</Text>
                </View>
              </View>
            )}

            {/* 編集モード */}
            {editingSchedule && (
              <View style={styles.editSection}>
                <View style={styles.editDivider} />

                {/* 就寝時刻編集 */}
                <Text style={styles.editLabel}>🌙 就寝時刻</Text>
                <View style={styles.editRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustSleepHour(-1)}>
                    <Text style={styles.editBtnText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.editTime}>
                    {effectiveSleep.hour.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustSleepHour(1)}>
                    <Text style={styles.editBtnText}>▼</Text>
                  </TouchableOpacity>
                  <Text style={styles.editColon}>:</Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustSleepMinute(-5)}>
                    <Text style={styles.editBtnText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.editTime}>
                    {effectiveSleep.minute.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustSleepMinute(5)}>
                    <Text style={styles.editBtnText}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* 起床時刻編集 */}
                <Text style={styles.editLabel}>☀️ 起床時刻</Text>
                <View style={styles.editRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustWakeHour(-1)}>
                    <Text style={styles.editBtnText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.editTime}>
                    {effectiveWake.hour.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustWakeHour(1)}>
                    <Text style={styles.editBtnText}>▼</Text>
                  </TouchableOpacity>
                  <Text style={styles.editColon}>:</Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustWakeMinute(-5)}>
                    <Text style={styles.editBtnText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.editTime}>
                    {effectiveWake.minute.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => adjustWakeMinute(5)}>
                    <Text style={styles.editBtnText}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* リセットボタン */}
                {isOverridden && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                      settings.clearTodayOverride();
                      setEditingSchedule(false);
                    }}
                  >
                    <Text style={styles.resetButtonText}>↩ デフォルトに戻す</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!editingSchedule && (
              <Text style={styles.tapHint}>タップして今日の時刻を変更</Text>
            )}
          </TouchableOpacity>


        </View>
      </ScrollView >
    </SafeAreaView >
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  // AI プランカード
  planCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  importanceBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  importanceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  planTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  planTimeItem: {
    alignItems: 'center',
  },
  planTimeLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  planTimeValue: {
    fontSize: 47,
    fontWeight: '200',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  planArrow: {
    fontSize: 26,
    color: '#64748B',
  },
  planEventText: {
    fontSize: 17,
    color: '#94A3B8',
    marginBottom: 6,
  },
  planAdvice: {
    fontSize: 17,
    color: '#94A3B8',
    lineHeight: 20,
  },
  // スケジュールカード
  scheduleCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  scheduleItem: {
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 47,
    fontWeight: '200',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    fontSize: 26,
    color: '#64748B',
  },
  durationText: {
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.primary,
  },
  scheduleCardOverridden: {
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overrideBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  overrideBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
  },
  tapHint: {
    textAlign: 'center',
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  // 編集UI
  editSection: {
    marginTop: 4,
  },
  editDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  editBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  editBtnText: {
    color: COLORS.primary,
    fontSize: 18,
  },
  editTime: {
    fontSize: 36,
    fontWeight: '200',
    color: COLORS.text.dark,
    width: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  editColon: {
    fontSize: 36,
    fontWeight: '200',
    color: COLORS.text.dark,
    marginHorizontal: 2,
  },
  resetButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.warning,
  },
  // モニターカード
  monitorCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  monitorCardActive: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  monitorText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  // スコアカード
  scoreCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 73,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 23,
    color: '#64748B',
    marginLeft: 4,
  },
  noDataText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
  },
  // 週間プランリンク
  weeklyLinkCard: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  weeklyLinkText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '500',
  },
});
