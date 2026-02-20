import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@features/auth';
import { supabase } from '@shared/lib';
import { useAuthStore } from '@features/auth/authStore';

/**
 * ログインルート
 * 既にセッションがあればタブへリダイレクト、なければログイン画面を表示
 */
export default function LoginRoute() {
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.user_metadata?.name ?? session.user.email ?? undefined,
      });
      router.replace('/(tabs)');
    })();
    return () => { cancelled = true; };
  }, [router, setUser]);

  const handleLoginSuccess = () => {
    router.replace('/(tabs)');
  };

  const handleNavigateToSignup = () => {
    router.push('/(auth)/signup');
  };

  return (
    <LoginScreen
      onLoginSuccess={handleLoginSuccess}
      onNavigateToSignup={handleNavigateToSignup}
    />
  );
}
