import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { useSleepSettingsStore } from './sleepSettingsStore';

/**
 * 睡眠設定画面
 * 起床時刻と睡眠時間を設定し、就寝予定時刻を自動計算する。
 * マウント時に GET /api/v1/settings で取得し、保存時に PUT で送信する。
 */
export const SleepSettingsScreen: React.FC = () => {
  const settings = useSleepSettingsStore();

  // ── マウント時にバックエンドから設定を取得 ──
  useEffect(() => {
    settings.fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 保存ハンドラ ──
  const handleSave = async () => {
    try {
      await settings.saveSettings();
      Alert.alert('保存完了', '設定を保存しました。');
    } catch {
      Alert.alert('エラー', '設定の保存に失敗しました。');
    }
  };

  // ── ローディング中はスピナーを表示 ──
  if (settings.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>設定を読み込み中…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 睡眠設定</Text>
      </View>

      <ScrollView style={styles.content}>
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
              onValueChange={val => settings.setMissionSettings(val, settings.missionTarget)}
            />
          </View>

          {settings.missionEnabled && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>対象物（例：洗面所）</Text>
              <TextInput
                style={styles.input}
                value={settings.missionTarget}
                onChangeText={text => settings.setMissionSettings(true, text)}
                placeholder="撮影対象を入力"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </View>

        {/* 準備時間設定 */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>🎒 お支度時間</Text>
          <View style={styles.durationRow}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() =>
                settings.setPreparationTime(Math.max(15, settings.preparationMinutes - 15))
              }
            >
              <Text style={styles.durationButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.durationValue}>{settings.preparationMinutes}</Text>
            <Text style={styles.durationUnit}>分</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() =>
                settings.setPreparationTime(Math.min(180, settings.preparationMinutes + 15))
              }
            >
              <Text style={styles.durationButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 保存ボタン */}
        <TouchableOpacity
          style={[styles.saveButton, settings.isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={settings.isSaving}
          activeOpacity={0.8}
        >
          {settings.isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>💾 保存する</Text>
          )}
        </TouchableOpacity>

        {/* 下部余白 */}
        <View style={{ height: 40 }} />
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

  /* ── ローディング ── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
  },

  /* ── 保存ボタン ── */
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
