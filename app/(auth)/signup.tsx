import { useRouter } from 'expo-router';
import { SignupScreen } from '@features/auth';

/**
 * サインアップルート
 */
export default function SignupRoute() {
  const router = useRouter();

  const handleSignupSuccess = () => {
    router.replace('/(tabs)');
  };

  const handleNavigateToLogin = () => {
    router.back();
  };

  return (
    <SignupScreen onSignupSuccess={handleSignupSuccess} onNavigateToLogin={handleNavigateToLogin} />
  );
}
