import { create } from 'zustand';

interface ErrorState {
  // 상태 (state)
  generalError: string;

  // 액션 (action)
  setGeneralError: (value: string) => void;
}

export const useErrorStore = create<ErrorState>()((set) => ({
  // 초기값
  generalError: '',

  // 액션
  setGeneralError: (value: string) => set({ generalError: value }),
}));
