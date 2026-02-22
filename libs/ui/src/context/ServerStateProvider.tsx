'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useGetTeams } from '@org/shop-data';

const ServerStateContext = createContext<{
  chatRoom: boolean;
  setChatRoom: (open: boolean) => void;
  serverProfile: boolean;
  setServerProfile: (open: boolean) => void;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  updateTeams: () => Promise<void>;
} | null>(null);

interface Team {
  teamId: string;
  teamName: string;
  serverImageUrl: string | null;
}

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const [chatRoom, setChatRoom] = useState(false);
  const [serverProfile, setServerProfile] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const updateTeams = async () => {
    try {
      const data = await useGetTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to update teams:', error);
    }
  };

  return (
    <ServerStateContext.Provider
      value={{
        chatRoom,
        setChatRoom,
        serverProfile,
        setServerProfile,
        teams,
        setTeams,
        updateTeams,
      }}
    >
      {children}
    </ServerStateContext.Provider>
  );
}

export function useServerState() {
  const ctx = useContext(ServerStateContext);
  if (!ctx) throw new Error('useServerState must be used inside provider');
  return ctx;
}
