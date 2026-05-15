import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from './types';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('dym_token'));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('dym_user');
    return u ? JSON.parse(u) : null;
  });

  const login = useCallback((t: string, u: User) => {
    localStorage.setItem('dym_token', t);
    localStorage.setItem('dym_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dym_token');
    localStorage.removeItem('dym_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
