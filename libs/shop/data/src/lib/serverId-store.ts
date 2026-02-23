import { create } from 'zustand';

interface LoadingState {
  // 상태 (state)
  serverId: string;

  // 액션 (action)
  setServerId: (value: string) => void;
}

export const useServerIdStore = create<LoadingState>()((set) => ({
  // 초기값
  serverId: '',

  // 액션
  setServerId: (value: string) => set({ serverId: value }),
}));
