'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getTeams, getTeamMembers } from '@org/shop-data';

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
  contextMenuUserId: string | null;
  setContextMenuUserId: React.Dispatch<React.SetStateAction<string | null>>;
  updateTeams: () => Promise<void>;
  updateTeamMembers: (id: string) => Promise<void>;
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
  const [contextMenuUserId, setContextMenuUserId] = useState<string | null>(
    null
  );

  const updateTeams = useCallback(async () => {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to update teams:', error);
    }
  }, []);

  const updateTeamMembers = useCallback(async (id: string) => {
    try {
      const data = await getTeamMembers(id);
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to update team members:', error);
    }
  }, []);

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
        contextMenuUserId,
        setContextMenuUserId,
        updateTeamMembers,
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
