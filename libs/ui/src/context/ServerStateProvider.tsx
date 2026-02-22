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
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  updateTeams: () => Promise<void>;
} | null>(null);

interface Team {
  teamId: string;
  teamName: string;
  serverImageUrl: string | null;
}

interface TeamMember {
  teamMemberId: string;
  name: string;
  role: string;
  team_id?: number;
}

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const [chatRoom, setChatRoom] = useState(false);
  const [serverProfile, setServerProfile] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

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
        teamMembers,
        setTeamMembers,
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
