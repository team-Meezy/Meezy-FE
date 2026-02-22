import { create } from 'zustand';

interface TimeState {
  // 상태 (state)
  remainingTime: number;

  // 액션 (action)
  setRemainingTime: (value: number | ((prev: number) => number)) => void;
}

export const useTimeStore = create<TimeState>()((set) => ({
  // 초기값
  remainingTime: 180,

  // 액션
  setRemainingTime: (time: number | ((prev: number) => number)) =>
    set((state) => ({
      remainingTime:
        typeof time === 'function' ? time(state.remainingTime) : time,
    })),
}));
