import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, TextInput, ScrollView } from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from './sleepSettingsStore';

/**
 * 睡眠設定画面
 * 起床時刻と睡眠時間を設定し、就寝予定時刻を自動計算する
 */
export const SleepSettingsScreen: React.FC = () => {
  const settings = useSleepSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 睡眠設定</Text>
      </View>

      <ScrollView style={styles.content}>
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

        {/* アラーム設定 */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>🔔 アラーム設定</Text>

          {/* レジリエンスウィンドウ */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>レジリエンス（優しさ）</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() =>
                  settings.setResilienceWindow(Math.max(0, settings.resilienceWindowMinutes - 5))
                }
              >
                <Text style={styles.smallButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.valueText}>{settings.resilienceWindowMinutes}分</Text>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() =>
                  settings.setResilienceWindow(Math.min(60, settings.resilienceWindowMinutes + 5))
                }
              >
                <Text style={styles.smallButtonText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ミッション設定 */}
          <View style={[styles.row, { marginTop: 16 }]}>
            <Text style={styles.rowLabel}>モーニングミッション</Text>
            <Switch
              value={settings.missionEnabled}
              onValueChange={(val) => settings.setMissionSettings(val, settings.missionTarget)}
            />
          </View>

          {settings.missionEnabled && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>対象物（例：洗面所）</Text>
              <TextInput
                style={styles.input}
                value={settings.missionTarget}
                onChangeText={(text) => settings.setMissionSettings(true, text)}
                placeholder="撮影対象を入力"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </View>


        {/* 準備時間設定 */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <Text style={styles.rowLabel}>お支度時間（起床〜出発）</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                settings.setPreparationTime(Math.max(15, settings.preparationMinutes - 15))
              }
            >
              <Text style={styles.smallButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.valueText}>{settings.preparationMinutes}分</Text>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                settings.setPreparationTime(Math.min(180, settings.preparationMinutes + 15))
              }
            >
              <Text style={styles.smallButtonText}>＋</Text>
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
      </ScrollView>
    </SafeAreaView >
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
    fontSize: 31,
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
    fontSize: 21,
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
    fontSize: 21,
  },
  timeDisplay: {
    fontSize: 52,
    fontWeight: '200',
    color: COLORS.text.dark,
    width: 60,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 52,
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
    fontSize: 31,
    fontWeight: '300',
  },
  durationValue: {
    fontSize: 62,
    fontWeight: '200',
    color: COLORS.text.dark,
    fontVariant: ['tabular-nums'],
  },
  durationUnit: {
    fontSize: 21,
    color: '#94A3B8',
  },
  resultCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  resultTime: {
    fontSize: 73,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  resultHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  rowLabel: {
    color: COLORS.text.dark,
    fontSize: 14,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    color: COLORS.primary,
    fontSize: 18,
  },
  valueText: {
    color: COLORS.text.dark,
    fontSize: 16,
    width: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 12,
    width: '100%',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1E293B',
    color: COLORS.text.dark,
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
});
