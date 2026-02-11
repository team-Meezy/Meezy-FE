'use client';

import { createContext, useContext, useState } from 'react';

const ServerLoadingContext = createContext<{
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadingState: string;
  setLoadingState: (loadingState: string) => void;
} | null>(null);

export function ServerLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState('');

  return (
    <ServerLoadingContext.Provider
      value={{
        loading,
        setLoading,
        loadingState,
        setLoadingState,
      }}
    >
      {children}
    </ServerLoadingContext.Provider>
  );
}

export function useServerLoading() {
  const ctx = useContext(ServerLoadingContext);
  if (!ctx) throw new Error('useServerLoading must be used inside provider');
  return ctx;
}
