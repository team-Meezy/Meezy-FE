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
  projectSidebarList: ProjectSidebarList[];
  setProjectSidebarList: React.Dispatch<
    React.SetStateAction<ProjectSidebarList[]>
  >;
  inviteCode: InviteCode;
  setInviteCode: React.Dispatch<React.SetStateAction<InviteCode>>;
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

interface ProjectSidebarList {
  team_id: number;
  team_name: string;
  create_at: null;
  invite_link: string;
}

interface InviteCode {
  inviteCode: string;
  expiresAt: string;
}

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const [chatRoom, setChatRoom] = useState(false);
  const [serverProfile, setServerProfile] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectSidebarList, setProjectSidebarList] = useState<
    ProjectSidebarList[]
  >([]);
  const [inviteCode, setInviteCode] = useState<InviteCode>({
    inviteCode: '',
    expiresAt: '',
  });

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
        projectSidebarList,
        setProjectSidebarList,
        inviteCode,
        setInviteCode,
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
