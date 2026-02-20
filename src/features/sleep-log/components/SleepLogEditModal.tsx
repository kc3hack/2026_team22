import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '@shared/constants';
import type { SleepLogEntry } from '../types';
import type { SleepLogEntryUpdate } from '../sleepLogApi';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'とても悪い' },
  { value: 2, emoji: '😟', label: '悪い' },
  { value: 3, emoji: '😐', label: 'ふつう' },
  { value: 4, emoji: '🙂', label: '良い' },
  { value: 5, emoji: '😊', label: 'とても良い' },
];

interface SleepLogEditModalProps {
  visible: boolean;
  log: SleepLogEntry | null;
  onSave: (updates: SleepLogEntryUpdate) => Promise<void>;
  onClose: () => void;
}

export const SleepLogEditModal: React.FC<SleepLogEditModalProps> = ({
  visible,
  log,
  onSave,
  onClose,
}) => {
  const [date, setDate] = useState('');
  const [score, setScore] = useState('');
  const [usagePenalty, setUsagePenalty] = useState('');
  const [environmentPenalty, setEnvironmentPenalty] = useState('');
  const [phase1Warning, setPhase1Warning] = useState(false);
  const [phase2Warning, setPhase2Warning] = useState(false);
  const [lightExceeded, setLightExceeded] = useState(false);
  const [noiseExceeded, setNoiseExceeded] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (log) {
      setDate(log.date);
      setScore(String(log.score));
      setUsagePenalty(String(log.usagePenalty));
      setEnvironmentPenalty(String(log.environmentPenalty));
      setPhase1Warning(log.phase1Warning);
      setPhase2Warning(log.phase2Warning);
      setLightExceeded(log.lightExceeded);
      setNoiseExceeded(log.noiseExceeded);
      setMood(log.mood);
      setError(null);
    }
  }, [log]);

  const handleSave = async () => {
    if (!log) return;
    setError(null);
    const scoreNum = parseInt(score, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError('スコアは 0〜100 で入力してください');
      return;
    }
    const usageNum = parseInt(usagePenalty, 10) || 0;
    const envNum = parseInt(environmentPenalty, 10) || 0;
    if (usageNum < 0 || envNum < 0) {
      setError('ペナルティは 0 以上で入力してください');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setError('日付は YYYY-MM-DD 形式で入力してください');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        date,
        score: scoreNum,
        usagePenalty: usageNum,
        environmentPenalty: envNum,
        phase1Warning,
        phase2Warning,
        lightExceeded,
        noiseExceeded,
        mood: mood,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!log) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>ログを編集</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>日付 (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-02-21"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
            />

            <Text style={styles.label}>スコア (0–100)</Text>
            <TextInput
              style={styles.input}
              value={score}
              onChangeText={setScore}
              keyboardType="number-pad"
              placeholder="85"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>スマホ使用ペナルティ</Text>
            <TextInput
              style={styles.input}
              value={usagePenalty}
              onChangeText={setUsagePenalty}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>環境ペナルティ</Text>
            <TextInput
              style={styles.input}
              value={environmentPenalty}
              onChangeText={setEnvironmentPenalty}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#64748B"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Phase1 警告</Text>
              <Switch value={phase1Warning} onValueChange={setPhase1Warning} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Phase2 警告</Text>
              <Switch value={phase2Warning} onValueChange={setPhase2Warning} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>照度超過</Text>
              <Switch value={lightExceeded} onValueChange={setLightExceeded} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>騒音超過</Text>
              <Switch value={noiseExceeded} onValueChange={setNoiseExceeded} />
            </View>

            <Text style={styles.label}>朝の気分</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.moodBtn, mood === opt.value && styles.moodBtnSelected]}
                  onPress={() => setMood(opt.value)}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.moodClear}
              onPress={() => setMood(null)}
            >
              <Text style={styles.moodClearText}>未記録にする</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.dark,
  },
  cancelText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  body: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.dark,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.text.dark,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  moodBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  moodBtnSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodClear: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  moodClearText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
