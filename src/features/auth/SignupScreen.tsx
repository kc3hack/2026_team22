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
  ScrollView,
} from 'react-native';
import { COLORS } from '@shared/constants';
import { supabase, isSupabaseConfigured } from '@shared/lib';
import { useAuthStore } from './authStore';

export interface SignupScreenProps {
  /** サインアップ成功時（セッション取得済み） */
  onSignupSuccess?: () => void;
  /** 「すでにアカウントがある」でログインへ */
  onNavigateToLogin?: () => void;
}

/**
 * サインアップ画面
 * Supabase Auth でメール/パスワードで新規登録する。
 * メール確認が有効な場合は「確認メールを送りました」と表示し、ログインへ誘導する。
 */
export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const setUser = useAuthStore(s => s.setUser);

  const handleSignup = async () => {
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください');
      return;
    }
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        setError('認証が未設定です。task dev-up で環境を用意してください。');
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message ?? '登録に失敗しました');
        return;
      }
      const user = data?.user;
      if (!user) {
        setError('登録に失敗しました');
        return;
      }
      // メール確認が必要な場合、session は null のことがある
      const session = data?.session;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name ?? session.user.email ?? undefined,
        });
        onSignupSuccess?.();
        return;
      }
      setMessage('確認メールを送信しました。メール内のリンクから認証を完了してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>アカウント作成</Text>
            <Text style={styles.subtitle}>メールアドレスとパスワードで新規登録</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {message && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
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
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>パスワード（6文字以上）</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="パスワードを入力"
                placeholderTextColor="#64748B"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>パスワード（確認）</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="もう一度入力"
                placeholderTextColor="#64748B"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? '登録中...' : '登録する'}</Text>
            </TouchableOpacity>

            {onNavigateToLogin && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={onNavigateToLogin}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>すでにアカウントがある → ログイン</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
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
  messageContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  messageText: {
    color: '#22c55e',
    fontSize: 16,
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
