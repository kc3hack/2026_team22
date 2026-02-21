import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from '@features/sleep-settings';
import { useSleepMonitor } from './hooks/useSleepMonitor';
import { PhaseIndicator } from './components/PhaseIndicator';
import { EnvironmentStatus } from './components/EnvironmentStatus';
import { UsageWarning } from './components/UsageWarning';
import { ScoreCard } from './components/ScoreCard';

/**
 * 睡眠監視メイン画面
 * フォアグラウンドで動作し、センサー・使用時間追跡・スコアリングを表示する。
 */
export const SleepMonitorScreen: React.FC = () => {
  const settings = useSleepSettingsStore();
  const monitor = useSleepMonitor();

  const effectiveSleep = settings.getEffectiveSleepTime();

  /**
   * 就寝予定時刻を指定して監視を開始
   */
  const handleStart = useCallback(() => {
    monitor.startMonitoring(settings.getSleepTimeToday());
  }, [settings, monitor]);

  /**
   * デモ用: 60分後を就寝時刻に設定して即開始
   */
  const handleQuickStart = useCallback(() => {
    const sleepTime = Date.now() + 60 * 60 * 1000; // 60分後
    monitor.startMonitoring(sleepTime);
  }, [monitor]);

  // 監視中の画面
  if (monitor.isMonitoring) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>🌙 睡眠モニター</Text>
            <TouchableOpacity onPress={monitor.stopMonitoring} style={styles.stopButton}>
              <Text style={styles.stopButtonText}>停止</Text>
            </TouchableOpacity>
          </View>

          {/* フェーズ表示 */}
          <PhaseIndicator
            currentPhase={monitor.currentPhase}
            remainingSeconds={monitor.remainingSeconds}
            totalRemainingSeconds={monitor.totalRemainingSeconds}
          />

          {/* スコア & 操作時間 */}
          <ScoreCard score={monitor.score} usageMinutes={monitor.usageMinutes} />

          {/* 環境ステータス */}
          <EnvironmentStatus
            lightLux={monitor.lightLux}
            noiseDb={monitor.noiseDb}
            isLightExceeded={monitor.isLightExceeded}
            isNoiseExceeded={monitor.isNoiseExceeded}
            lightSource={monitor.lightSource}
          />
        </ScrollView>

        {/* 警告オーバーレイ */}
        <UsageWarning
          message={monitor.latestWarning ?? ''}
          visible={monitor.showWarning}
          onDismiss={monitor.dismissWarning}
        />
      </SafeAreaView>
    );
  }

  // 待機画面（監視開始前）
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🌙 睡眠モニター</Text>
        </View>

        {/* 説明 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>就寝モードについて</Text>
          <Text style={styles.infoText}>
            就寝1時間前から自動で環境センシングとスマホ操作の監視を開始します。{'\n\n'}• Phase
            1（30分）: スマホ操作を記録{'\n'}• Phase 2（20分）: 操作に厳重注意{'\n'}• Phase
            3（10分）: 入眠準備チェック
          </Text>
        </View>

        {/* 就寝時刻設定 */}
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>今日の就寝予定時刻</Text>
          <View style={styles.timePickerRow}>
            <Text style={styles.timeDisplay}>{effectiveSleep.hour.toString().padStart(2, '0')}</Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Text style={styles.timeDisplay}>{effectiveSleep.minute.toString().padStart(2, '0')}</Text>
          </View>
        </View>

        {/* 開始ボタン */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>就寝モード開始</Text>
          <Text style={styles.startButtonSub}>（1時間前から監視）</Text>
        </TouchableOpacity>

        {/* クイックスタート */}
        <TouchableOpacity style={styles.quickStartButton} onPress={handleQuickStart}>
          <Text style={styles.quickStartText}>🧪 デモ: 60分後を就寝時刻にして開始</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 31,
    fontWeight: 'bold',
    color: COLORS.text.dark,
  },
  stopButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: COLORS.text.dark,
    fontWeight: '600',
    fontSize: 18,
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 22,
  },
  settingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  timeDisplay: {
    fontSize: 62,
    fontWeight: '200',
    color: COLORS.text.dark,
    width: 70,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 62,
    fontWeight: '200',
    color: COLORS.text.dark,
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: COLORS.text.dark,
    fontSize: 23,
    fontWeight: '700',
  },
  startButtonSub: {
    color: COLORS.text.dark,
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  quickStartButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickStartText: {
    color: '#94A3B8',
    fontSize: 18,
  },
});
