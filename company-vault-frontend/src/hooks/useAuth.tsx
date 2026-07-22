import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AdminUser } from '@/types/domain';
import { authService } from '@/services/authService';
import { setApiAuthToken } from '@/services/apiClient';
import { sessionStorage } from '@/utils/sessionStorage';

interface AuthContextValue {
  status: 'loading' | 'signedOut' | 'signedIn';
  admin: AdminUser | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await sessionStorage.getToken();
      if (!token) {
        setStatus('signedOut');
        return;
      }
      try {
        setApiAuthToken(token);
        const current = await authService.getCurrentAdmin(token);
        setAdmin(current);
        setStatus('signedIn');
      } catch {
        await sessionStorage.clearToken();
        setApiAuthToken(null);
        setStatus('signedOut');
      }
    })();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const session = await authService.loginWithGoogle();
      await sessionStorage.setToken(session.token);
      setApiAuthToken(session.token);
      setAdmin(session.admin);
      setStatus('signedIn');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    await sessionStorage.clearToken();
    setApiAuthToken(null);
    setAdmin(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, admin, error, signInWithGoogle, signOut }),
    [status, admin, error, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
