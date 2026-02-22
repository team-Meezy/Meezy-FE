import { create } from 'zustand';

interface ModalState {
  // 상태 (state)
  isModalOpen: boolean;
  mounted: boolean;
  password: string;
  serverName: string;
  newPassword: string;
  serverLink: string;
  createModal: boolean;

  // 액션 (action)
  setIsModalOpen: (value: boolean) => void;
  setMounted: (value: boolean) => void;
  setPassword: (value: string) => void;
  setServerName: (value: string) => void;
  setNewPassword: (value: string) => void;
  setServerLink: (value: string) => void;
  setCreateModal: (value: boolean) => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  // 초기값
  isModalOpen: false,
  mounted: false,
  password: '',
  serverName: '',
  newPassword: '',
  serverLink: '',
  createModal: true,

  // 액션
  setIsModalOpen: (value: boolean) => set({ isModalOpen: value }),
  setMounted: (value: boolean) => set({ mounted: value }),
  setPassword: (value: string) => set({ password: value }),
  setServerName: (value: string) => set({ serverName: value }),
  setNewPassword: (value: string) => set({ newPassword: value }),
  setServerLink: (value: string) => set({ serverLink: value }),
  setCreateModal: (value: boolean) => set({ createModal: value }),
}));
