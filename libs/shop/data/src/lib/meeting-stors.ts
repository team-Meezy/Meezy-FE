import { create } from 'zustand';

interface MeetingState {
  // 상태 (state)
  meetingId: string;
  teamId: string;
  isUploading: boolean;
  isRecording: boolean;

  // 액션 (action)
  setMeetingId: (value: string) => void;
  setTeamId: (value: string) => void;
  setIsUploading: (value: boolean) => void;
  setIsRecording: (value: boolean) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  // 초기값
  meetingId: '',
  teamId: '',
  isUploading: false,
  isRecording: false,

  // 액션
  setMeetingId: (value: string) => set({ meetingId: value }),
  setTeamId: (value: string) => set({ teamId: value }),
  setIsUploading: (value: boolean) => set({ isUploading: value }),
  setIsRecording: (value: boolean) => set({ isRecording: value }),
}));
