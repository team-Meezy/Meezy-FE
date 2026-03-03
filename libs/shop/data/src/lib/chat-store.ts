import { create } from 'zustand';

interface ChatRoom {
  chatRoomId: string;
  team_id: number;
  name: string;
  create_at: string | null;
}

export interface Message {
  id: number;
  chatRoomId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatState {
  // 상태 (state)
  messages: Message[];
  chatRooms: ChatRoom[];

  // 액션 (action)
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  // 초기값
  messages: [],
  chatRooms: [],

  // 액션
  setMessages: (messages: Message[]) => set({ messages: [...messages] }),
  addMessage: (msg: Message) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setChatRooms: (chatRooms: ChatRoom[]) => set({ chatRooms: [...chatRooms] }),
}));
