import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import type { MonitorPhase } from '../types';

interface PhaseIndicatorProps {
  /** 現在のフェーズ */
  currentPhase: MonitorPhase;
  /** フェーズ内の残り時間（秒） */
  remainingSeconds: number;
  /** 全体の残り時間（秒） */
  totalRemainingSeconds: number;
}

/** フェーズごとの表示情報 */
const PHASE_INFO: Record<MonitorPhase, { label: string; emoji: string; color: string }> = {
  idle: { label: '待機中', emoji: '⏳', color: '#64748B' },
  phase1: { label: 'Phase 1 - 監視開始', emoji: '👀', color: COLORS.primary },
  phase2: { label: 'Phase 2 - 要注意', emoji: '⚠️', color: COLORS.warning },
  phase3: { label: 'Phase 3 - 入眠準備', emoji: '🌙', color: COLORS.secondary },
  completed: { label: '完了', emoji: '✅', color: COLORS.success },
};

/** 秒をmm:ss形式に */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * フェーズインジケーター
 * 現在の監視フェーズと残り時間を視覚的に表示
 */
export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  currentPhase,
  remainingSeconds,
  totalRemainingSeconds,
}) => {
  const info = PHASE_INFO[currentPhase];

  // プログレス計算（全体60分に対する経過割合）
  const totalSeconds = 60 * 60; // 60分
  const elapsed = totalSeconds - totalRemainingSeconds;
  const progress = Math.min(1, Math.max(0, elapsed / totalSeconds));

  return (
    <View style={styles.container}>
      {/* フェーズラベル */}
      <View style={styles.phaseHeader}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <Text style={[styles.phaseLabel, { color: info.color }]}>{info.label}</Text>
      </View>

      {/* タイマー */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>フェーズ残り</Text>
        <Text style={[styles.timer, { color: info.color }]}>{formatTime(remainingSeconds)}</Text>
      </View>

      {/* プログレスバー */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress * 100}%`, backgroundColor: info.color },
          ]}
        />
        {/* フェーズ区切りマーカー */}
        <View style={[styles.marker, { left: '50%' }]} />
        <View style={[styles.marker, { left: '83.3%' }]} />
      </View>

      {/* 全体残り時間 */}
      <Text style={styles.totalTime}>就寝まで {formatTime(totalRemainingSeconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 31,
    marginRight: 10,
  },
  phaseLabel: {
    fontSize: 23,
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 4,
  },
  timer: {
    fontSize: 62,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#334155',
  },
  totalTime: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
  },
});
