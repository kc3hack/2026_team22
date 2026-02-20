import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSleepSchedule } from '../hooks/useSleepSchedule';
import { COLORS } from '@shared/constants';

export const SleepAdvice = () => {
  const { advice, loading, fetchAdvice } = useSleepSchedule();

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>スケジュールを分析中...</Text>
      </View>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Pre-Sleep Boost</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.recommendationLabel}>今日のおすすめ就寝時刻</Text>
        <Text style={styles.time}>{advice.recommendedBedtime}</Text>
        <Text style={styles.reason}>{advice.reason}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    color: COLORS.text.dark,
  },
  content: {
    alignItems: 'center',
  },
  recommendationLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  time: {
    fontSize: 47,
    fontWeight: '200',
    color: COLORS.text.dark,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  reason: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 22,
    textAlign: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 16,
  },
});
