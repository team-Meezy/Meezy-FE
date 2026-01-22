'use client';

import { createContext, useContext, useState } from 'react';

const ServerJoinedTeamContext = createContext<{
  joined: boolean;
  setJoined: (joined: boolean) => void;
  meeting: boolean;
  setMeeting: (meeting: boolean) => void;
  selectedRoomId: number | null;
  setSelectedRoomId: (selectedRoomId: number | null) => void;
} | null>(null);

export function ServerJoinedTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [joined, setJoined] = useState(false);
  const [meeting, setMeeting] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  return (
    <ServerJoinedTeamContext.Provider
      value={{
        joined,
        setJoined,
        meeting,
        setMeeting,
        selectedRoomId,
        setSelectedRoomId,
      }}
    >
      {children}
    </ServerJoinedTeamContext.Provider>
  );
}

export function useServerJoinedTeam() {
  const ctx = useContext(ServerJoinedTeamContext);
  if (!ctx) throw new Error('useServerJoinedTeam must be used inside provider');
  return ctx;
}
