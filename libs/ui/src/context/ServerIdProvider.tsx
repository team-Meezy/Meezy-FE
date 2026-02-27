'use client';

import { createContext, useContext, useState, useMemo } from 'react';

const ServerIdContext = createContext<{
  serverId: number | null;
  setServerId: (f: number | null) => void;
} | null>(null);

export function ServerIdProvider({ children }: { children: React.ReactNode }) {
  const [serverId, setServerId] = useState<number | null>(null);

  const value = useMemo(() => ({ serverId, setServerId }), [serverId]);

  return (
    <ServerIdContext.Provider value={value}>
      {children}
    </ServerIdContext.Provider>
  );
}

export function useServerId() {
  const ctx = useContext(ServerIdContext);
  if (!ctx) throw new Error('useServerId must be used inside provider');
  return ctx;
}
