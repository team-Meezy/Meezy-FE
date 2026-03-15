'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { getTeams, getTeamMembers, getChatRooms } from '@org/shop-data';
import { useTeamStore, useChatStore } from '@org/shop-data';

const ServerStateContext = createContext<{
  chatRoom: boolean;
  setChatRoom: (open: boolean) => void;
  serverProfile: boolean;
  setServerProfile: (open: boolean) => void;
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
  updateChatRooms: (id: string) => Promise<any[]>;
} | null>(null);

interface TeamMember {
  teamMemberId: string;
  name: string;
  role: string;
  profileImage?: string;
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
  const { setTeams } = useTeamStore();
  const { setChatRooms } = useChatStore();

  const updateTeams = useCallback(async () => {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to update teams:', error);
      throw error;
    }
  }, [setTeams]);

  const updateTeamMembers = useCallback(async (id: string) => {
    try {
      const data = await getTeamMembers(id);
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to update team members:', error);
      throw error;
    }
  }, []);

  const updateChatRooms = useCallback(
    async (id: string) => {
      try {
        const data = await getChatRooms(id);
        setChatRooms(data);
        return data;
      } catch (error) {
        console.error('Failed to update chat rooms:', error);
        throw error;
      }
    },
    [setChatRooms]
  );

  const value = useMemo(
    () => ({
      chatRoom,
      setChatRoom,
      serverProfile,
      setServerProfile,
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
      updateChatRooms,
    }),
    [
      chatRoom,
      serverProfile,
      teamMembers,
      updateTeams,
      projectSidebarList,
      inviteCode,
      contextMenuUserId,
      updateTeamMembers,
      updateChatRooms,
    ]
  );

  return (
    <ServerStateContext.Provider value={value}>
      {children}
    </ServerStateContext.Provider>
  );
}

export function useServerState() {
  const ctx = useContext(ServerStateContext);
  if (!ctx) throw new Error('useServerState must be used inside provider');
  return ctx;
}
