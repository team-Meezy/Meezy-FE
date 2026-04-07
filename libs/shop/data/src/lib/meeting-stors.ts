import { create } from 'zustand';
import type { MeetingIceServer } from './hooks/meeting/types';

interface MeetingState {
  meetingId: string;
  teamId: string;
  lastEndedMeetingId: string;
  lastEndedTeamId: string;
  iceServers: MeetingIceServer[];
  isUploading: boolean;
  isRecording: boolean;
  hasActiveMeeting: boolean;
  startTime: string | null;
  recordingElapsedMs: number;
  setMeetingId: (value: string) => void;
  setTeamId: (value: string) => void;
  setLastEndedMeeting: (meetingId: string, teamId: string) => void;
  setIceServers: (value: MeetingIceServer[]) => void;
  setIsUploading: (value: boolean) => void;
  setIsRecording: (value: boolean) => void;
  setHasActiveMeeting: (value: boolean) => void;
  setStartTime: (value: string | null) => void;
  setRecordingElapsedMs: (value: number) => void;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  meetingId: '',
  teamId: '',
  lastEndedMeetingId: '',
  lastEndedTeamId: '',
  iceServers: [],
  isUploading: false,
  isRecording: false,
  hasActiveMeeting: false,
  startTime: null,
  recordingElapsedMs: 0,
  setMeetingId: (value: string) => set({ meetingId: value }),
  setTeamId: (value: string) => set({ teamId: value }),
  setLastEndedMeeting: (meetingId: string, teamId: string) =>
    set({ lastEndedMeetingId: meetingId, lastEndedTeamId: teamId }),
  setIceServers: (value: MeetingIceServer[]) => set({ iceServers: value }),
  setIsUploading: (value: boolean) => set({ isUploading: value }),
  setIsRecording: (value: boolean) => set({ isRecording: value }),
  setHasActiveMeeting: (value: boolean) => set({ hasActiveMeeting: value }),
  setStartTime: (value: string | null) => set({ startTime: value }),
  setRecordingElapsedMs: (value: number) => set({ recordingElapsedMs: value }),
}));
