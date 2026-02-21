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
import { getYesterdayLocalString } from '@shared/lib';
import type { SleepLogEntry } from '../types';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'とても悪い' },
  { value: 2, emoji: '😟', label: '悪い' },
  { value: 3, emoji: '😐', label: 'ふつう' },
  { value: 4, emoji: '🙂', label: '良い' },
  { value: 5, emoji: '😊', label: 'とても良い' },
];

export type AddSleepLogEntry = Omit<SleepLogEntry, 'id' | 'createdAt'>;

interface AddSleepLogModalProps {
  visible: boolean;
  /** 初期日付（例: 昨夜を記録なら昨日の YYYY-MM-DD） */
  initialDate?: string;
  /** タイトル（未指定なら「記録を追加」） */
  title?: string;
  onAdd: (entry: AddSleepLogEntry) => Promise<void>;
  onSuccess?: () => void;
  onClose: () => void;
}

function getYesterdayISO(): string {
  return getYesterdayLocalString();
}

export const AddSleepLogModal: React.FC<AddSleepLogModalProps> = ({
  visible,
  initialDate,
  title = '記録を追加',
  onAdd,
  onSuccess,
  onClose,
}) => {
  const [date, setDate] = useState(initialDate ?? getYesterdayISO());
  const [score, setScore] = useState('');
  const [usagePenalty, setUsagePenalty] = useState('0');
  const [environmentPenalty, setEnvironmentPenalty] = useState('0');
  const [phase1Warning, setPhase1Warning] = useState(false);
  const [phase2Warning, setPhase2Warning] = useState(false);
  const [lightExceeded, setLightExceeded] = useState(false);
  const [noiseExceeded, setNoiseExceeded] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDate(initialDate ?? getYesterdayISO());
      setScore('');
      setUsagePenalty('0');
      setEnvironmentPenalty('0');
      setPhase1Warning(false);
      setPhase2Warning(false);
      setLightExceeded(false);
      setNoiseExceeded(false);
      setMood(null);
      setError(null);
    }
  }, [visible, initialDate]);

  const handleSubmit = async () => {
    setError(null);
    const scoreNum = parseInt(score, 10);
    if (score === '' || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
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
      await onAdd({
        date,
        score: scoreNum,
        scheduledSleepTime: 0,
        usagePenalty: usageNum,
        environmentPenalty: envNum,
        phase1Warning,
        phase2Warning,
        lightExceeded,
        noiseExceeded,
        mood,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('409') || msg.includes('already exists') || msg.includes('Sleep log already')) {
        setError('その日は既に記録があります。編集する場合は一覧で該当のログを開き「編集」から変更してください。');
      } else {
        setError(msg || '保存に失敗しました');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
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

            <Text style={styles.label}>朝の気分（任意）</Text>
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
            <TouchableOpacity style={styles.moodClear} onPress={() => setMood(null)}>
              <Text style={styles.moodClearText}>未記録のまま</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSubmit}
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
