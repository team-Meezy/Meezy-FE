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
  messages: Message[];
  chatRooms: ChatRoom[];
  activeChatRoomId: string | null;
  unreadCounts: Record<string, number>;
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  receiveMessage: (msg: Message) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
  setActiveChatRoomId: (chatRoomId: string | null) => void;
  clearUnread: (chatRoomId: string) => void;
}

function upsertMessage(messages: Message[], msg: Message) {
  const existingIndex = messages.findIndex(
    (message) => message.chatMessageId === msg.chatMessageId
  );

  if (existingIndex >= 0) {
    const nextMessages = [...messages];
    nextMessages[existingIndex] = {
      ...nextMessages[existingIndex],
      ...msg,
      isOptimistic: msg.isOptimistic ?? nextMessages[existingIndex].isOptimistic,
    };
    return nextMessages;
  }

  if (!msg.isOptimistic) {
    const optimisticIndex = messages.findIndex((message) => {
      if (!message.isOptimistic) return false;
      if (message.chatRoomId !== msg.chatRoomId) return false;
      if (message.senderName !== msg.senderName) return false;
      if (message.content !== msg.content) return false;

      const optimisticTime = new Date(message.createdAt).getTime();
      const incomingTime = new Date(msg.createdAt).getTime();

      return Math.abs(incomingTime - optimisticTime) <= 30000;
    });

    if (optimisticIndex >= 0) {
      const nextMessages = [...messages];
      nextMessages[optimisticIndex] = msg;
      return nextMessages;
    }
  }

  return [...messages, msg];
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  chatRooms: [],
  activeChatRoomId: null,
  unreadCounts: {},
  setMessages: (messages: Message[]) => set({ messages: [...messages] }),
  addMessage: (msg: Message) =>
    set((state) => ({ messages: upsertMessage(state.messages, msg) })),
  receiveMessage: (msg: Message) =>
    set((state) => {
      if (state.activeChatRoomId === msg.chatRoomId) {
        return {
          messages: upsertMessage(state.messages, msg),
          unreadCounts: {
            ...state.unreadCounts,
            [msg.chatRoomId]: 0,
          },
        };
      }

      return {
        unreadCounts: {
          ...state.unreadCounts,
          [msg.chatRoomId]: (state.unreadCounts[msg.chatRoomId] ?? 0) + 1,
        },
      };
    }),
  setChatRooms: (chatRooms: ChatRoom[]) =>
    set((state) => {
      const roomIds = new Set(chatRooms.map((room) => room.chatRoomId));
      const unreadCounts = Object.fromEntries(
        Object.entries(state.unreadCounts).filter(([roomId]) => roomIds.has(roomId))
      );

      return {
        chatRooms: [...chatRooms],
        unreadCounts,
      };
    }),
  setActiveChatRoomId: (chatRoomId: string | null) =>
    set((state) => ({
      activeChatRoomId: chatRoomId,
      unreadCounts: chatRoomId
        ? {
            ...state.unreadCounts,
            [chatRoomId]: 0,
          }
        : state.unreadCounts,
    })),
  clearUnread: (chatRoomId: string) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatRoomId]: 0,
      },
    })),
}));
