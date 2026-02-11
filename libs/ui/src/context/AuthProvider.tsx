'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  isHydrated: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rememberMe, setRememberMeState] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('rememberMe');
    if (saved !== null) {
      setRememberMeState(saved === 'true');
    }
    setIsHydrated(true);
  }, []);

  const setRememberMe = (value: boolean) => {
    setRememberMeState(value);
    localStorage.setItem('rememberMe', String(value));
  };

  return (
    <AuthContext.Provider value={{ rememberMe, setRememberMe, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside provider');
  return ctx;
}
