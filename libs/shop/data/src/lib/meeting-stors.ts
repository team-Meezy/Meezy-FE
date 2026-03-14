import { create } from 'zustand';

interface MeetingState {
  // 상태 (state)
  meetingId: string;
  isUploading: boolean;
  isRecording: boolean;

  // 액션 (action)
  setMeetingId: (value: string) => void;
  setIsUploading: (value: boolean) => void;
  setIsRecording: (value: boolean) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  // 초기값
  meetingId: '',
  isUploading: false,
  isRecording: false,

  // 액션
  setMeetingId: (value: string) => set({ meetingId: value }),
  setIsUploading: (value: boolean) => set({ isUploading: value }),
  setIsRecording: (value: boolean) => set({ isRecording: value }),
}));
