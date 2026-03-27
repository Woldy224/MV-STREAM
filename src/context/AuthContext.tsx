import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, ApiUser } from '../utils/api';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin' | string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (full_name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(u: ApiUser): User {
  return {
    id: String(u.id),
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    isAdmin: String(u.role).toLowerCase() === 'admin',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-restore session from token
  useEffect(() => {
    const init = async () => {
      try {
        const token = AuthAPI.token();
        if (!token) {
          // no session stored
          return;
        }
        const me = await AuthAPI.me();
        setUser(normalizeUser(me));
      } catch {
        // token invalid/expired
        localStorage.removeItem('mv_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await AuthAPI.login(email, password);
      setUser(normalizeUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (full_name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await AuthAPI.register(full_name, email, password);
      setUser(normalizeUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthAPI.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
