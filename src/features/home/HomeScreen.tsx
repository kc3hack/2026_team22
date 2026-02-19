import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from '@features/sleep-settings';
import { useSleepMonitorStore } from '@features/sleep-monitor';
import { useSleepLogStore } from '@features/sleep-log';
import { useSleepPlanStore } from '@features/sleep-plan';
import { useEffect } from 'react';

/**
 * ホーム画面（ダッシュボード）
 * 今夜の就寝予定・モニタリング状態・最新スコア・今日の睡眠プランを表示
 */
export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const settings = useSleepSettingsStore();
  const monitor = useSleepMonitorStore();
  const { logs } = useSleepLogStore();
  const latestScore = logs[0]?.score ?? null;
  const { plan, fetchPlan } = useSleepPlanStore();
  const todayPlan = useSleepPlanStore(state => state.getTodayPlan());

  // プランを取得（キャッシュ期限内ならスキップ）
  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  const sleepTimeStr = `${settings.calculatedSleepHour.toString().padStart(2, '0')}:${settings.calculatedSleepMinute.toString().padStart(2, '0')}`;
  const wakeTimeStr = `${settings.wakeUpHour.toString().padStart(2, '0')}:${settings.wakeUpMinute.toString().padStart(2, '0')}`;

  const importanceColor = {
    high: COLORS.error,
    medium: COLORS.warning,
    low: COLORS.success,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>おやすみサポート</Text>
        <Text style={styles.subtitle}>良質な睡眠のための準備を</Text>
      </View>

      <View style={styles.content}>
        {/* 今日の睡眠プラン */}
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

        {/* 今夜の予定 */}
        <View style={styles.scheduleCard}>
          <Text style={styles.cardTitle}>🌙 今夜のスケジュール</Text>
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
          <Text style={styles.durationText}>睡眠時間: {settings.sleepDurationHours}時間</Text>
        </View>

        {/* モニタリング状態 */}
        <TouchableOpacity
          style={[styles.monitorCard, monitor.isMonitoring && styles.monitorCardActive]}
          onPress={() => router.push('/sleep-monitor' as never)}
        >
          <Text style={styles.cardTitle}>{monitor.isMonitoring ? '🟢 監視中' : '⚪ 待機中'}</Text>
          <Text style={styles.monitorText}>
            {monitor.isMonitoring
              ? `${monitor.currentPhase.toUpperCase()} - タップして確認`
              : 'タップして睡眠モニターを開始'}
          </Text>
        </TouchableOpacity>

        {/* 最新スコア */}
        <TouchableOpacity
          style={styles.scoreCard}
          onPress={() => router.push('/sleep-log' as never)}
        >
          <Text style={styles.cardTitle}>📊 最新スコア</Text>
          {latestScore !== null ? (
            <View style={styles.scoreRow}>
              <Text
                style={[
                  styles.scoreValue,
                  {
                    color:
                      latestScore >= 80
                        ? COLORS.success
                        : latestScore >= 50
                          ? COLORS.warning
                          : COLORS.error,
                  },
                ]}
              >
                {latestScore}
              </Text>
              <Text style={styles.scoreUnit}>/ 100</Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>まだデータがありません</Text>
          )}
        </TouchableOpacity>

        {/* 週間プランへのリンク */}
        {plan && (
          <TouchableOpacity
            style={styles.weeklyLinkCard}
            onPress={() => router.push('/sleep-plan' as never)}
          >
            <Text style={styles.weeklyLinkText}>📋 週間プランを確認する →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  // AI プランカード
  planCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  planTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  planTimeItem: {
    alignItems: 'center',
  },
  planTimeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  planTimeValue: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  planArrow: {
    fontSize: 16,
    color: '#475569',
    marginTop: 12,
  },
  planEventText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
  },
  planAdvice: {
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 36,
    fontWeight: '200',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    fontSize: 20,
    color: '#64748B',
  },
  durationText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.primary,
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
    fontSize: 14,
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
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 18,
    color: '#64748B',
    marginLeft: 4,
  },
  noDataText: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '500',
  },
});
