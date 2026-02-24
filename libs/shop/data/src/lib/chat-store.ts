import { create } from 'zustand';

interface ChatRoom {
  room_id: number;
  team_id: number;
  name: string;
  create_at: string | null;
}

interface ChatState {
  // 상태 (state)
  messages: string[];
  chatRooms: ChatRoom[];

  // 액션 (action)
  setMessages: (value: string[]) => void;
  addMessage: (msg: string) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  // 초기값
  messages: [],
  chatRooms: [],

  // 액션
  setMessages: (value: string[]) => set({ messages: value }),
  addMessage: (msg: string) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setChatRooms: (chatRooms: ChatRoom[]) => set({ chatRooms: [...chatRooms] }),
}));
