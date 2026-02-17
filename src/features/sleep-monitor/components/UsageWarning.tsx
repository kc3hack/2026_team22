import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '@shared/constants';

interface UsageWarningProps {
  /** 警告メッセージ */
  message: string;
  /** 表示するか */
  visible: boolean;
  /** 閉じるコールバック */
  onDismiss: () => void;
}

/**
 * スマホ操作警告オーバーレイ
 * Phase1/2の警告条件を満たした際に全画面で表示
 */
export const UsageWarning: React.FC<UsageWarningProps> = ({ message, visible, onDismiss }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* 警告アイコン */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚨</Text>
          </View>

          {/* タイトル */}
          <Text style={styles.title}>執事からの警告</Text>

          {/* メッセージ */}
          <Text style={styles.message}>{message}</Text>

          {/* 閉じるボタン */}
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>分かりました</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.text.dark,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});
