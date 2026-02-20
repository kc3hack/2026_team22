import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepLogStore } from './sleepLogStore';
import { SleepScoreDisplay } from './components/SleepScoreDisplay';
import { SleepLogList } from './components/SleepLogList';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';

/**
 * 睡眠ログ画面
 * 過去の睡眠準備スコアの履歴を表示
 */
export const SleepLogScreen: React.FC = () => {
  const { logs, isLoading, fetchLogs } = useSleepLogStore();

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);
  const latestLog = logs[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 睡眠ログ</Text>
        <Text style={styles.subtitle}>睡眠準備の振り返り</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ローディング */}
        {isLoading && logs.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* 最新スコア */}
        {latestLog && (
          <View style={styles.latestCard}>
            <SleepScoreDisplay score={latestLog.score} dateLabel={`最新: ${latestLog.date}`} />
          </View>
        )}

        {/* 週間トレンド */}
        {logs.length > 0 && <WeeklyTrendChart logs={logs} />}

        {/* ログ一覧 */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 履歴</Text>
            <Text style={styles.logCount}>{logs.length}件</Text>
          </View>
          <SleepLogList logs={logs} />
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 31,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  latestCard: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.text.dark,
  },
  logCount: {
    fontSize: 17,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
