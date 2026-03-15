'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useMeetingWebRTC } from '../hooks/useMeetingWebRTC';
import { useMeetingStore } from '@org/shop-data';
import { useProfile } from './ProfileProvider';

interface MeetingContextType {
  localStream: MediaStream | null;
  remoteStreams: any[];
  isSpeaking: boolean;
  isRecording: boolean;
  connectToUser: (targetUserId: string) => Promise<void>;
  initLocalMedia: () => Promise<MediaStream | null>;
  startRecording: () => void;
  stopRecording: () => void;
}

const MeetingContext = createContext<MeetingContextType | null>(null);

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const { meetingId, teamId } = useMeetingStore();
  const { profile } = useProfile();
  const myId = profile?.userId || profile?.id || profile?.user_id || profile?.accountId;

  // Only activate WebRTC if there is an active meeting and we have our ID
  // We use teamId from the store (set by Header or other triggers)
  const webrtc = useMeetingWebRTC(teamId, myId || '');

  const value = useMemo(() => ({
    ...webrtc
  }), [webrtc]);

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
