import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LoginState {
  // 상태 (state)
  rememberMe: boolean;
  isHydrated: boolean;
  isProcessing: boolean;

  // 액션 (action)
  setRememberMe: (value: boolean) => void;
  setIsHydrated: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
}

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      // 초기값
      rememberMe: false,
      isHydrated: false,
      isProcessing: true,

      // 액션
      setRememberMe: (value: boolean) => set({ rememberMe: value }),
      setIsHydrated: (value: boolean) => set({ isHydrated: value }),
      setIsProcessing: (value: boolean) => set({ isProcessing: value }),
    }),
    {
      name: 'remember-me-storage', // localStorage에 저장될 Key 이름
      partialize: (state) => ({ rememberMe: state.rememberMe }),
    }
  )
);
