import { create } from 'zustand';

interface ErrorState {
  // 상태 (state)
  messages: string[];

  // 액션 (action)
  setMessages: (value: string[]) => void;
  addMessage: (msg: string) => void;
}

export const useChatStore = create<ErrorState>()((set) => ({
  // 초기값
  messages: [],

  // 액션
  setMessages: (value: string[]) => set({ messages: value }),
  addMessage: (msg: string) =>
    set((state) => ({ messages: [...state.messages, msg] })),
}));
