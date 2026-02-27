import { create } from 'zustand';

interface MeetingState {
  // 상태 (state)
  meetingId: string;

  // 액션 (action)
  setMeetingId: (value: string) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  // 초기값
  meetingId: '',

  // 액션
  setMeetingId: (value: string) => set({ meetingId: value }),
}));
