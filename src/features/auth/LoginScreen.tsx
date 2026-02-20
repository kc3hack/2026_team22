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
import { supabase, isSupabaseConfigured } from '@shared/lib';
import { useAuthStore } from './authStore';

export interface LoginScreenProps {
  /** ログイン成功時（セッション取得済み） */
  onLoginSuccess?: () => void;
  /** 「アカウントを作成」でサインアップへ */
  onNavigateToSignup?: () => void;
}

/**
 * ログイン画面
 * Supabase Auth でメール/パスワード認証を行い、セッションを取得する。
 * 取得したトークンは apiClient 経由の API 呼び出しで自動付与される。
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser, setLoading, setError, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        setError('認証が未設定です。task dev-up で環境を用意してください。');
        return;
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message ?? 'ログインに失敗しました');
        return;
      }
      const user = data?.user;
      if (!user) {
        setError('ログインに失敗しました');
        return;
      }
      setUser({
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.name ?? user.email ?? undefined,
      });
      onLoginSuccess?.();
    } finally {
      setLoading(false);
    }
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

          {onNavigateToSignup && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={onNavigateToSignup}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>アカウントを作成 → サインアップ</Text>
            </TouchableOpacity>
          )}
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
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 21,
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
    fontSize: 18,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 18,
    color: COLORS.text.dark,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 12,
    padding: 16,
    fontSize: 21,
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
    fontSize: 23,
    fontWeight: '600',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 18,
  },
});
