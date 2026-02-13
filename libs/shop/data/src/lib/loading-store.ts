import { create } from 'zustand';

interface LoadingState {
  // 상태 (state)
  loading: boolean;
  loadingState: string;

  // 액션 (action)
  setLoading: (value: boolean) => void;
  setLoadingState: (value: string) => void;
}

export const useLoadingStore = create<LoadingState>()((set) => ({
  // 초기값
  loading: false,
  loadingState: '',

  // 액션
  setLoading: (value: boolean) => set({ loading: value }),
  setLoadingState: (value: string) => set({ loadingState: value }),
}));
