import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '@shared/constants';
import { useSleepPlanStore } from './sleepPlanStore';
import { WeeklyPlanCard } from './components/WeeklyPlanCard';
import { PlanStatus } from './components/PlanStatus';
import { DayDetailModal } from './components/DayDetailModal';

/**
 * 週間睡眠プラン画面 — Cosmic Sleep デザイン
 * AIが生成した7日分の睡眠プランを美しく表示
 */
export const SleepPlanScreen: React.FC = () => {
  const { plan, isFetching, isLoading, error, fetchPlan } = useSleepPlanStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // アニメーション
  const moonFloat = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // 今日の日付
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 画面がフォーカスされるたびにプランを取得（設定変更後にタブで戻ってきたときも再取得される）
  useFocusEffect(
    useCallback(() => {
      void fetchPlan();
    }, [fetchPlan])
  );

  // ヘッダーアニメーション
  useEffect(() => {
    // 月の浮遊アニメーション
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonFloat, {
          toValue: -8,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(moonFloat, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ヘッダーフェードイン
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [moonFloat, headerFade]);

  // コンテンツフェードイン
  useEffect(() => {
    if (plan) {
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [plan, contentFade]);

  // プラン未取得時はローディング or エラー表示（初回は isLoading が false の一瞬があるため !plan でまとめて表示）
  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        {/* 背景装飾 */}
        <View style={styles.bgStars}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  top: `${8 + i * 10}%`,
                  right: `${5 + (i % 4) * 22}%`,
                  opacity: 0.15 + (i % 3) * 0.1,
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                },
              ]}
            />
          ))}
        </View>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.titleRow}>
            <Animated.Text style={[styles.moonIcon, { transform: [{ translateY: moonFloat }] }]}>
              🌙
            </Animated.Text>
            <Text style={styles.title}>週間睡眠プラン</Text>
          </View>
        </Animated.View>
        <PlanStatus
          isLoading={isFetching || !error}
          error={error}
          onRetry={() => void fetchPlan()}
        />
      </SafeAreaView>
    );
  }

  // プラン取得済み: キャッシュならそのまま表示、AI生成中（1秒経過後）はローディングオーバーレイ
  return (
    <SafeAreaView style={styles.container}>
      {/* 背景装飾 */}
      <View style={styles.bgStars}>
        {[...Array(8)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                top: `${8 + i * 10}%`,
                right: `${5 + (i % 4) * 22}%`,
                opacity: 0.15 + (i % 3) * 0.1,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ── ヘッダー ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.titleRow}>
            <Animated.Text style={[styles.moonIcon, { transform: [{ translateY: moonFloat }] }]}>
              🌙
            </Animated.Text>
            <View>
              <Text style={styles.title}>週間睡眠プラン</Text>
              <Text style={styles.subtitle}>AIがあなたの予定に合わせて最適化</Text>
            </View>
          </View>

          {/* キャッシュバッジ */}
          {plan && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaEmoji}>{plan.cacheHit ? '♻️' : '✨'}</Text>
              <Text style={styles.metaText}>
                {plan.cacheHit ? 'キャッシュ' : '新規生成'}
                {' · '}
                {new Date(plan.createdAt).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── 全日程一覧 ── */}
        <Animated.View style={{ opacity: contentFade }}>
          {plan && (
            <View style={styles.allPlansSection}>
              <Text style={styles.sectionTitle}>📋 1週間の概要</Text>
              <Text style={styles.sectionSubtitle}>タップで詳細を確認できます</Text>
              {plan.dailyPlans.map((p, i) => (
                <WeeklyPlanCard
                  key={p.date}
                  plan={p}
                  isToday={p.date === todayStr}
                  index={i}
                  onPress={() => setSelectedIndex(i)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* AI生成中（1秒経過後）のローディングオーバーレイ。キャッシュの場合は表示されない */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <PlanStatus isLoading={true} error={null} onRetry={() => {}} />
        </View>
      )}

      {/* 曜日詳細モーダル */}
      {plan && (
        <DayDetailModal
          plan={selectedIndex !== null ? (plan.dailyPlans[selectedIndex] ?? null) : null}
          allPlans={plan.dailyPlans}
          selectedIndex={selectedIndex ?? 0}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  bgStars: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  // Header
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  moonIcon: {
    fontSize: 42,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#94A3B8',
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginTop: 4,
  },
  metaEmoji: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // All plans
  allPlansSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: COLORS.text.dark,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
