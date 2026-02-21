import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from '@features/sleep-settings';
import { WheelPicker } from '@shared/components/WheelPicker';
import { useSleepLogStore } from '@features/sleep-log';
import { usePendingLastNightStore } from '@features/sleep-log/pendingLastNightStore';
import { useSleepPlanStore } from '@features/sleep-plan';
import { MorningReviewCard } from './components/MorningReviewCard';

/**
 * ホーム画面（ダッシュボード）
 * 今夜の就寝予定・モニタリング状態・最新スコア・今日の睡眠プランを表示
 */
export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const settings = useSleepSettingsStore();
  const { logs, setMood, fetchLogs, addLog } = useSleepLogStore();
  const { pending: pendingLastNight, clearPending: clearPendingLastNight } =
    usePendingLastNightStore();
  const latestLog = logs[0] ?? null;
  const { fetchPlan } = useSleepPlanStore();
  const todayPlan = useSleepPlanStore(state => state.getTodayPlan());

  // ログとプランを取得
  useEffect(() => {
    void fetchLogs();
    void fetchPlan();
  }, [fetchLogs, fetchPlan]);

  // AIプランが読み込まれたらスケジュール初期値として設定（初回のみ。ユーザーが解除した後に再同期しない）
  const hasSyncedPlanToOverride = useRef(false);
  const lastSyncedDate = useRef<string | null>(null);
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (lastSyncedDate.current !== todayStr) {
      hasSyncedPlanToOverride.current = false;
      lastSyncedDate.current = todayStr;
    }
    if (todayPlan && !settings.todayOverride && !hasSyncedPlanToOverride.current) {
      const sleepParts = todayPlan.recommendedSleepTime.split(':');
      const wakeParts = todayPlan.recommendedWakeTime.split(':');

      if (sleepParts.length === 2 && wakeParts.length === 2) {
        settings.setTodayOverride({
          sleepHour: parseInt(sleepParts[0], 10),
          sleepMinute: parseInt(sleepParts[1], 10),
          wakeHour: parseInt(wakeParts[0], 10),
          wakeMinute: parseInt(wakeParts[1], 10),
        });
        hasSyncedPlanToOverride.current = true;
      }
    }
  }, [todayPlan, settings]);

  /** オーバーライドが有効か（今日の日付で todayOverride が設定されている） */
  const isOverrideActive = useMemo(() => {
    if (!settings.todayOverride) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return settings.todayOverride.date === todayStr;
  }, [settings.todayOverride]);

  /** 表示用の時刻の前回値（オーバーライドOFF・プランなしのとき設定デフォルトに切り替えず維持する用） */
  const lastDisplayedTimeRef = useRef<{ sleep: { hour: number; minute: number }; wake: { hour: number; minute: number } } | null>(null);

  // 表示用の時刻（オーバーライドON＝override、OFF＝プラン推奨。設定のデフォルトには切り替えず今ある情報を維持）
  const effectiveSleep = useMemo(() => {
    if (isOverrideActive) return settings.getEffectiveSleepTime();
    if (todayPlan) {
      const [h, m] = todayPlan.recommendedSleepTime.split(':').map(Number);
      return { hour: h ?? 0, minute: m ?? 0 };
    }
    return lastDisplayedTimeRef.current?.sleep ?? { hour: 22, minute: 0 };
  }, [isOverrideActive, todayPlan, settings.todayOverride]);
  const effectiveWake = useMemo(() => {
    if (isOverrideActive) return settings.getEffectiveWakeTime();
    if (todayPlan) {
      const [h, m] = todayPlan.recommendedWakeTime.split(':').map(Number);
      return { hour: h ?? 0, minute: m ?? 0 };
    }
    return lastDisplayedTimeRef.current?.wake ?? { hour: 6, minute: 0 };
  }, [isOverrideActive, todayPlan, settings.todayOverride]);

  useEffect(() => {
    if (isOverrideActive || todayPlan) {
      lastDisplayedTimeRef.current = { sleep: effectiveSleep, wake: effectiveWake };
    }
  }, [isOverrideActive, todayPlan, effectiveSleep, effectiveWake]);

  const sleepTimeStr = `${effectiveSleep.hour.toString().padStart(2, '0')}:${effectiveSleep.minute.toString().padStart(2, '0')}`;
  const wakeTimeStr = `${effectiveWake.hour.toString().padStart(2, '0')}:${effectiveWake.minute.toString().padStart(2, '0')}`;

  // カスタムピッカー（ホイール）用の状態
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'sleep' | 'wake'>('sleep');

  // ピッカー内で選択中の時間
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // 選択肢の生成 (10周分用意して無限スクロール風にする)
  const HOURS_MAX = 24;
  const MINUTES_MAX = 60;
  const MINUTE_INTERVAL = 5;
  const LOOPS = 10;

  const hours = Array.from({ length: HOURS_MAX * LOOPS }, (_, i) => {
    const realHour = i % HOURS_MAX;
    return {
      label: realHour.toString().padStart(2, '0'),
      // valueをユニークにするため、インデックスをそのまま値として扱う
      value: i,
      realValue: realHour,
    };
  });

  const minutes = Array.from({ length: (MINUTES_MAX / MINUTE_INTERVAL) * LOOPS }, (_, i) => {
    const realMinute = (i % (MINUTES_MAX / MINUTE_INTERVAL)) * MINUTE_INTERVAL;
    return {
      label: realMinute.toString().padStart(2, '0'),
      value: i,
      realValue: realMinute,
    };
  });

  // モーダルを開くとき、真ん中の周回付近からスタートさせるための関数
  const getCenterIndex = (realValue: number, isHour: boolean) => {
    const max = isHour ? HOURS_MAX : MINUTES_MAX / MINUTE_INTERVAL;
    const valueIndex = isHour ? realValue : realValue / MINUTE_INTERVAL;
    const centerLoop = Math.floor(LOOPS / 2); // 真ん中の周回
    return centerLoop * max + valueIndex;
  };

  const openPicker = (target: 'sleep' | 'wake') => {
    setPickerTarget(target);
    if (target === 'sleep') {
      setSelectedHour(getCenterIndex(effectiveSleep.hour, true));
      setSelectedMinute(getCenterIndex(effectiveSleep.minute, false));
    } else {
      setSelectedHour(getCenterIndex(effectiveWake.hour, true));
      setSelectedMinute(getCenterIndex(effectiveWake.minute, false));
    }
    setPickerVisible(true);
  };

  const handleConfirmTime = () => {
    setPickerVisible(false);

    // value は単なるインデックスになっているので realValue を取り出す
    const realSelectedHour = hours[selectedHour]?.realValue ?? 0;
    const realSelectedMinute = minutes[selectedMinute]?.realValue ?? 0;

    if (pickerTarget === 'sleep') {
      settings.setTodayOverride({
        sleepHour: realSelectedHour,
        sleepMinute: realSelectedMinute,
        wakeHour: effectiveWake.hour,
        wakeMinute: effectiveWake.minute,
      });
    } else {
      settings.setTodayOverride({
        sleepHour: effectiveSleep.hour,
        sleepMinute: effectiveSleep.minute,
        wakeHour: realSelectedHour,
        wakeMinute: realSelectedMinute,
      });
    }
  };

  // 朝の時間帯か（起床時刻以降）
  const isMorning = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const wakeMinutes = settings.wakeUpHour * 60 + settings.wakeUpMinute;
    return currentMinutes >= wakeMinutes;
  }, [settings.wakeUpHour, settings.wakeUpMinute]);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  /** 昨日のログ（あれば） */
  const logForYesterday = useMemo(
    () => logs.find(l => l.date === yesterdayStr) ?? null,
    [logs, yesterdayStr],
  );
  const hasLogForYesterday = logForYesterday !== null;

  /**
   * 朝の振り返りカードを表示: 昨日のログが既にある、またはアプリが記録した昨夜分の仮データがある。
   * 気分を選んだら → ログありなら PATCH、ログなしなら 仮データ＋気分で POST して保存。
   */
  const showMorningReview =
    (__DEV__ || isMorning) && (hasLogForYesterday || pendingLastNight !== null);

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
          {/* 朝の振り返りカード（ログあり→気分だけ更新 / 仮データあり→気分選択で自動保存） */}
          {showMorningReview && (logForYesterday || pendingLastNight) && (
            <MorningReviewCard
              score={
                logForYesterday
                  ? logForYesterday.score
                  : pendingLastNight!.score
              }
              initialMood={logForYesterday?.mood ?? null}
              onSelectMood={mood => {
                if (logForYesterday) {
                  void setMood(logForYesterday.id, mood).then(() => {
                    void fetchPlan(); // 気分変更でプラン再生成（sleep_logs の入力が変わるため）
                  });
                } else if (pendingLastNight) {
                  void addLog({
                    date: pendingLastNight.date,
                    score: pendingLastNight.score,
                    scheduledSleepTime: pendingLastNight.scheduledSleepTime,
                    usagePenalty: pendingLastNight.usagePenalty,
                    usageMinutes: pendingLastNight.usageMinutes ?? 0,
                    environmentPenalty: pendingLastNight.environmentPenalty,
                    phase1Warning: pendingLastNight.phase1Warning,
                    phase2Warning: pendingLastNight.phase2Warning,
                    lightExceeded: pendingLastNight.lightExceeded,
                    noiseExceeded: pendingLastNight.noiseExceeded,
                    mood,
                  }).then(() => {
                    clearPendingLastNight();
                    void fetchLogs();
                    void fetchPlan(); // 新規ログ追加でプラン再生成
                  });
                }
              }}
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
                    style={[
                      styles.importanceText,
                      { color: importanceColor[todayPlan.importance] },
                    ]}
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
          <View style={[styles.scheduleCard, isOverrideActive && styles.scheduleCardOverridden]}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.cardTitle}>📅今日の時刻をカスタム</Text>
              <Switch
                value={isOverrideActive}
                onValueChange={async (value: boolean) => {
                  if (value) {
                    settings.setTodayOverride({
                      sleepHour: effectiveSleep.hour,
                      sleepMinute: effectiveSleep.minute,
                      wakeHour: effectiveWake.hour,
                      wakeMinute: effectiveWake.minute,
                    });
                    hasSyncedPlanToOverride.current = true;
                  } else {
                    settings.clearTodayOverride();
                    hasSyncedPlanToOverride.current = true;
                  }
                  try {
                    await settings.saveSettings();
                    void fetchPlan();
                  } catch {
                    // ローカルは更新済み
                  }
                }}
                trackColor={{ false: '#334155', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.scheduleRow}>
              <TouchableOpacity style={styles.scheduleItem} onPress={() => openPicker('sleep')}>
                <Text style={styles.scheduleLabel}>就寝</Text>
                <Text style={styles.scheduleTime}>{sleepTimeStr}</Text>
              </TouchableOpacity>

              <Text style={styles.arrow}>→</Text>

              <TouchableOpacity style={styles.scheduleItem} onPress={() => openPicker('wake')}>
                <Text style={styles.scheduleLabel}>起床</Text>
                <Text style={styles.scheduleTime}>{wakeTimeStr}</Text>
              </TouchableOpacity>
            </View>

            {!isOverrideActive && <Text style={styles.tapHint}>時刻をタップして変更</Text>}

            {/* カスタム時間ピッカーモーダル */}
            <Modal
              visible={isPickerVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setPickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <Pressable style={styles.modalBackground} onPress={() => setPickerVisible(false)} />

                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      onPress={() => setPickerVisible(false)}
                      style={styles.modalHeaderButton}
                    >
                      <Text style={styles.cancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                      {pickerTarget === 'sleep' ? '🌙 就寝時刻' : '☀️ 起床時刻'}
                    </Text>
                    <TouchableOpacity onPress={handleConfirmTime} style={styles.modalHeaderButton}>
                      <Text style={styles.confirmButtonText}>確定</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerWrapper}>
                      <View style={{ flex: 1 }}>
                        <WheelPicker
                          items={hours}
                          selectedValue={selectedHour}
                          onValueChange={itemValue => setSelectedHour(itemValue)}
                        />
                      </View>
                      <Text style={styles.pickerLabel}>時</Text>
                    </View>

                    <Text style={styles.pickerColon}>:</Text>

                    <View style={styles.pickerWrapper}>
                      <View style={{ flex: 1 }}>
                        <WheelPicker
                          items={minutes}
                          selectedValue={selectedMinute}
                          onValueChange={itemValue => setSelectedMinute(itemValue)}
                        />
                      </View>
                      <Text style={styles.pickerLabel}>分</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
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
  tapHint: {
    textAlign: 'center',
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  // モーダル周り
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40, // for safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalHeaderButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#94A3B8',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.dark,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    backgroundColor: '#1E293B',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  pickerColon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginHorizontal: 10,
  },
  pickerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginLeft: -10,
    marginRight: 10,
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
