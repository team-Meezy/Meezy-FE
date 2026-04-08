import { create } from 'zustand';

interface ChatRoom {
  chatRoomId: string;
  team_id: number;
  name: string;
  create_at: string | null;
}

export interface Message {
  chatMessageId: string;
  chatRoomId: string;
  senderName: string;
  profileImage?: string;
  senderProfileImageUrl?: string;
  senderImage?: string;
  content: string;
  createdAt: string;
  isOptimistic?: boolean;
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
    set((state) => {
      const existingIndex = state.messages.findIndex(
        (message) => message.chatMessageId === msg.chatMessageId
      );

      if (existingIndex >= 0) {
        const messages = [...state.messages];
        messages[existingIndex] = {
          ...messages[existingIndex],
          ...msg,
          isOptimistic: msg.isOptimistic ?? messages[existingIndex].isOptimistic,
        };
        return { messages };
      }

      if (!msg.isOptimistic) {
        const optimisticIndex = state.messages.findIndex((message) => {
          if (!message.isOptimistic) return false;
          if (message.chatRoomId !== msg.chatRoomId) return false;
          if (message.senderName !== msg.senderName) return false;
          if (message.content !== msg.content) return false;

          const optimisticTime = new Date(message.createdAt).getTime();
          const incomingTime = new Date(msg.createdAt).getTime();

          return Math.abs(incomingTime - optimisticTime) <= 30000;
        });

        if (optimisticIndex >= 0) {
          const messages = [...state.messages];
          messages[optimisticIndex] = msg;
          return { messages };
        }
      }

      return { messages: [...state.messages, msg] };
    }),
  setChatRooms: (chatRooms: ChatRoom[]) => set({ chatRooms: [...chatRooms] }),
}));
