import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { useAuthStore } from './authStore';

/**
 * ログイン画面
 * ユーザー認証を行う画面（雛形）
 */
export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    // TODO: 実際の認証ロジックを実装
    // LLM認証やGoogleカレンダー連携などを追加予定

    // 仮のログイン成功処理
    setUser({
      id: '1',
      email,
      name: 'Test User',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>ログイン</Text>
          <Text style={styles.subtitle}>睡眠サポートアプリへようこそ</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="パスワードを入力"
              placeholderTextColor="#64748B"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'ログイン中...' : 'ログイン'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.dark,
    opacity: 0.7,
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.dark,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.dark,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text.dark,
    fontSize: 18,
    fontWeight: '600',
  },
});
