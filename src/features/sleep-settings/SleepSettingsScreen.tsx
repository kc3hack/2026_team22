import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from './sleepSettingsStore';
import { getReminderTimeString } from '@shared/lib';

/**
 * 睡眠設定画面
 * 起床時刻と睡眠時間を設定し、就寝予定時刻を自動計算する
 * 就寝リマインダー通知のON/OFFを切り替えられる
 */
export const SleepSettingsScreen: React.FC = () => {
  const settings = useSleepSettingsStore();

  const reminderTime = getReminderTimeString(
    settings.calculatedSleepHour,
    settings.calculatedSleepMinute,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 睡眠設定</Text>
      </View>

      <View style={styles.content}>
        {/* 起床時刻 */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>⏰ 起床時刻</Text>
          <View style={styles.timePickerRow}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() =>
                settings.setWakeUpTime((settings.wakeUpHour - 1 + 24) % 24, settings.wakeUpMinute)
              }
            >
              <Text style={styles.timeButtonText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDisplay}>
              {settings.wakeUpHour.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() =>
                settings.setWakeUpTime((settings.wakeUpHour + 1) % 24, settings.wakeUpMinute)
              }
            >
              <Text style={styles.timeButtonText}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.timeSeparator}>:</Text>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() =>
                settings.setWakeUpTime(settings.wakeUpHour, (settings.wakeUpMinute - 5 + 60) % 60)
              }
            >
              <Text style={styles.timeButtonText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDisplay}>
              {settings.wakeUpMinute.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() =>
                settings.setWakeUpTime(settings.wakeUpHour, (settings.wakeUpMinute + 5) % 60)
              }
            >
              <Text style={styles.timeButtonText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 睡眠時間 */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>😴 睡眠時間</Text>
          <View style={styles.durationRow}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() =>
                settings.setSleepDuration(Math.max(4, settings.sleepDurationHours - 1))
              }
            >
              <Text style={styles.durationButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.durationValue}>{settings.sleepDurationHours}</Text>
            <Text style={styles.durationUnit}>時間</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() =>
                settings.setSleepDuration(Math.min(12, settings.sleepDurationHours + 1))
              }
            >
              <Text style={styles.durationButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 計算結果 */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>🌙 就寝予定時刻</Text>
          <Text style={styles.resultTime}>
            {settings.calculatedSleepHour.toString().padStart(2, '0')}:
            {settings.calculatedSleepMinute.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.resultHint}>この時刻の1時間前から監視が開始されます</Text>
        </View>

        {/* 就寝リマインダー通知 */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <View>
              <Text style={styles.reminderLabel}>🔔 就寝リマインダー</Text>
              <Text style={styles.reminderDesc}>就寝時刻の1時間前に通知</Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={settings.setReminderEnabled}
              trackColor={{ false: '#334155', true: COLORS.primary }}
              thumbColor={settings.reminderEnabled ? '#E0E7FF' : '#94A3B8'}
              ios_backgroundColor="#334155"
            />
          </View>
          {settings.reminderEnabled && (
            <View style={styles.reminderTimeRow}>
              <Text style={styles.reminderTimeLabel}>通知予定時刻</Text>
              <Text style={styles.reminderTimeValue}>{reminderTime}</Text>
            </View>
          )}
        </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  timeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  timeDisplay: {
    fontSize: 40,
    fontWeight: '200',
    color: COLORS.text.dark,
    width: 60,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 40,
    fontWeight: '200',
    color: COLORS.text.dark,
    marginHorizontal: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  durationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 22,
  },
  durationButtonText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '300',
  },
  durationValue: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  durationUnit: {
    fontSize: 16,
    color: '#94A3B8',
  },
  resultCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  resultTime: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  resultHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  // リマインダーカード
  reminderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 4,
  },
  reminderDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reminderTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  reminderTimeLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  reminderTimeValue: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
});
