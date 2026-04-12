import { create } from 'zustand';
import type { MeetingIceServer } from './hooks/meeting/types';

const LAST_ENDED_MEETING_STORAGE_KEY = 'meezy:last-ended-meeting';

function persistLastEndedMeeting(meetingId: string, teamId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(
    LAST_ENDED_MEETING_STORAGE_KEY,
    JSON.stringify({ meetingId, teamId })
  );
}

interface MeetingState {
  meetingId: string;
  teamId: string;
  meetingTitle: string;
  lastEndedMeetingId: string;
  lastEndedTeamId: string;
  iceServers: MeetingIceServer[];
  isUploading: boolean;
  isRecording: boolean;
  hasActiveMeeting: boolean;
  shouldAutoStartRecording: boolean;
  startTime: string | null;
  recordingElapsedMs: number;
  setMeetingId: (value: string) => void;
  setTeamId: (value: string) => void;
  setMeetingTitle: (value: string) => void;
  setLastEndedMeeting: (meetingId: string, teamId: string) => void;
  setIceServers: (value: MeetingIceServer[]) => void;
  setIsUploading: (value: boolean) => void;
  setIsRecording: (value: boolean) => void;
  setHasActiveMeeting: (value: boolean) => void;
  setShouldAutoStartRecording: (value: boolean) => void;
  setStartTime: (value: string | null) => void;
  setRecordingElapsedMs: (value: number) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  meetingId: '',
  teamId: '',
  meetingTitle: '',
  lastEndedMeetingId: '',
  lastEndedTeamId: '',
  iceServers: [],
  isUploading: false,
  isRecording: false,
  hasActiveMeeting: false,
  shouldAutoStartRecording: false,
  startTime: null,
  recordingElapsedMs: 0,
  setMeetingId: (value: string) => set({ meetingId: value }),
  setTeamId: (value: string) => set({ teamId: value }),
  setMeetingTitle: (value: string) => set({ meetingTitle: value }),
  setLastEndedMeeting: (meetingId: string, teamId: string) => {
    persistLastEndedMeeting(meetingId, teamId);
    set({ lastEndedMeetingId: meetingId, lastEndedTeamId: teamId });
  },
  setIceServers: (value: MeetingIceServer[]) => set({ iceServers: value }),
  setIsUploading: (value: boolean) => set({ isUploading: value }),
  setIsRecording: (value: boolean) => set({ isRecording: value }),
  setHasActiveMeeting: (value: boolean) => set({ hasActiveMeeting: value }),
  setShouldAutoStartRecording: (value: boolean) =>
    set({ shouldAutoStartRecording: value }),
  setStartTime: (value: string | null) => set({ startTime: value }),
  setRecordingElapsedMs: (value: number) => set({ recordingElapsedMs: value }),
}));
