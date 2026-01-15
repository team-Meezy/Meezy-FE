'use client';

import { createContext, useContext, useState } from 'react';

const ServerJoinedTeamContext = createContext<{
  joined: boolean;
  setJoined: (joined: boolean) => void;
} | null>(null);

export function ServerJoinedTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [joined, setJoined] = useState(false);

  return (
    <ServerJoinedTeamContext.Provider value={{ joined, setJoined }}>
      {children}
    </ServerJoinedTeamContext.Provider>
  );
}

export function useServerJoinedTeam() {
  const ctx = useContext(ServerJoinedTeamContext);
  if (!ctx) throw new Error('useServerJoinedTeam must be used inside provider');
  return ctx;
}
