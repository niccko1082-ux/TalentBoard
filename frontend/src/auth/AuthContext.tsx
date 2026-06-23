import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserResponse } from '../types';
import { authApi } from '../api/resources';
import {
  clearCredentials,
  getStoredUser,
  hasToken,
  setCredentials,
} from '../api/credentials';

interface AuthState {
  user: UserResponse | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(getStoredUser());
  const [initializing, setInitializing] = useState<boolean>(hasToken());

  // On first load, if we have a stored token, validate it against the API.
  useEffect(() => {
    if (!hasToken()) {
      setInitializing(false);
      return;
    }
    authApi
      .me()
      .then((me) => setUser(me))
      .catch(() => {
        clearCredentials();
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  async function login(email: string, password: string): Promise<UserResponse> {
    const authHeader = `Basic ${btoa(`${email}:${password}`)}`;
    const me = await authApi.me(authHeader);
    setCredentials(email, password, me);
    setUser(me);
    return me;
  }

  function logout(): void {
    authApi.logout().catch(() => undefined);
    clearCredentials();
    setUser(null);
  }

  const value = useMemo<AuthState>(
    () => ({ user, initializing, login, logout }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
