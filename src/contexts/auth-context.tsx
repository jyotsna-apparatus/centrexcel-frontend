'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { getMe } from '@/lib/auth-api';
import type { LoginUser } from '@/lib/auth-api';

type AuthContextValue = {
  user: LoginUser | null;
  setUser: (user: LoginUser | null) => void;
  /** Fetch current user and update context. Use after login or to refresh. */
  loadUser: () => Promise<LoginUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const res = await getMe();
      const next = res.data?.user ?? null;
      setUser(next);
      return next;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

/** Safe hook for components that may render outside AuthProvider (e.g. sidebar). Returns null if no provider. */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
