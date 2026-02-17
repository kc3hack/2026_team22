import { create } from 'zustand';

/**
 * ユーザー情報の型定義
 */
interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * 認証状態の型定義
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 認証アクションの型定義
 */
interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

/**
 * 認証ストア（Zustand）
 * ユーザーの認証状態を管理
 */
export const useAuthStore = create<AuthState & AuthActions>(set => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: user =>
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    }),

  setLoading: isLoading => set({ isLoading }),

  setError: error => set({ error, isLoading: false }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    }),
}));
