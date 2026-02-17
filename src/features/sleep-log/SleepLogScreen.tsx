import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepLogStore } from './sleepLogStore';
import { SleepScoreDisplay } from './components/SleepScoreDisplay';
import { SleepLogList } from './components/SleepLogList';

/**
 * 睡眠ログ画面
 * 過去の睡眠準備スコアの履歴を表示
 */
export const SleepLogScreen: React.FC = () => {
  const { logs } = useSleepLogStore();
  const latestLog = logs[0] ?? null;

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 睡眠ログ</Text>
        <Text style={styles.subtitle}>睡眠準備の振り返り</Text>
      </View>

      {/* 最新スコア */}
      {latestLog && (
        <View style={styles.latestCard}>
          <SleepScoreDisplay score={latestLog.score} dateLabel={`最新: ${latestLog.date}`} />
        </View>
      )}

      {/* ログ一覧 */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>履歴</Text>
        <SleepLogList logs={logs} />
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
    paddingTop: 20,
    paddingBottom: 10,
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
  latestCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 12,
  },
});
