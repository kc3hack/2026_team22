import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepLogStore } from './sleepLogStore';
import { SleepScoreDisplay } from './components/SleepScoreDisplay';
import { SleepLogList } from './components/SleepLogList';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';

/** 日付を読みやすくフォーマット (2025-02-21 → 2/21 金) */
const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} ${weekDays[d.getDay()]}`;
};

/**
 * 睡眠ログ画面
 * 過去の睡眠準備スコアの履歴を表示（追加・編集は不可）
 */
export const SleepLogScreen: React.FC = () => {
  const { logs, isLoading, error, fetchLogs, clearError } = useSleepLogStore();

  useFocusEffect(
    useCallback(() => {
      void fetchLogs();
    }, [fetchLogs])
  );
  const latestLog = logs[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>睡眠ログ</Text>
        <Text style={styles.subtitle}>就寝準備の記録と推移</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* エラー表示 */}
        {error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                clearError();
                void fetchLogs();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>再読み込み</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ローディング */}
        {isLoading && logs.length === 0 && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        )}

        {!error && (
          <>
            {/* 最新スコア（ヒーローカード） */}
            {latestLog && (
              <View style={styles.latestCard}>
                <SleepScoreDisplay
                  score={latestLog.score}
                  dateLabel={formatDateLabel(latestLog.date)}
                />
              </View>
            )}

            {/* 週間トレンド */}
            {logs.length > 0 && <WeeklyTrendChart logs={logs} />}

            {/* 履歴一覧 */}
            <View style={styles.listContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>履歴</Text>
                {logs.length > 0 && (
                  <Text style={styles.logCount}>全{logs.length}件</Text>
                )}
              </View>
              <SleepLogList logs={logs} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 48,
    paddingTop: 20,
  },
  latestCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.dark,
    letterSpacing: 0.3,
  },
  logCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 15,
    marginBottom: 14,
    lineHeight: 22,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
