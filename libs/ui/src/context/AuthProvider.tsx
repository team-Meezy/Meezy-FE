'use client';

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
} | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  return (
    <AuthContext.Provider value={{ rememberMe, setRememberMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside provider');
  return ctx;
}
