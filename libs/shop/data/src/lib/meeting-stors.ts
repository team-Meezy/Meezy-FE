import { create } from 'zustand';

type MeetingIceServer = {
  urls: string | string[];
  username?: string | null;
  credential?: string | null;
};

interface MeetingState {
  meetingId: string;
  teamId: string;
  iceServers: MeetingIceServer[];
  isUploading: boolean;
  isRecording: boolean;
  hasActiveMeeting: boolean;
  startTime: string | null;
  setMeetingId: (value: string) => void;
  setTeamId: (value: string) => void;
  setIceServers: (value: MeetingIceServer[]) => void;
  setIsUploading: (value: boolean) => void;
  setIsRecording: (value: boolean) => void;
  setHasActiveMeeting: (value: boolean) => void;
  setStartTime: (value: string | null) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  meetingId: '',
  teamId: '',
  iceServers: [],
  isUploading: false,
  isRecording: false,
  hasActiveMeeting: false,
  startTime: null,
  setMeetingId: (value: string) => set({ meetingId: value }),
  setTeamId: (value: string) => set({ teamId: value }),
  setIceServers: (value: MeetingIceServer[]) => set({ iceServers: value }),
  setIsUploading: (value: boolean) => set({ isUploading: value }),
  setIsRecording: (value: boolean) => set({ isRecording: value }),
  setHasActiveMeeting: (value: boolean) => set({ hasActiveMeeting: value }),
  setStartTime: (value: string | null) => set({ startTime: value }),
}));
