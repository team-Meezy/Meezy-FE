import { create } from 'zustand';

interface Team {
  teamId: string;
  teamName: string;
  serverImageUrl: string | null;
}

interface ErrorState {
  // 상태 (state)
  teams: Team[];

  // 액션 (action)
  setTeams: (value: Team[]) => void;
}

export const useTeamStore = create<ErrorState>()((set) => ({
  // 초기값
  teams: [],

  // 액션
  setTeams: (value: Team[]) => set({ teams: value }),
}));
