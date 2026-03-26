'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useMeetingWebRTC } from '../hooks/useMeetingWebRTC';
import { useMeetingStore } from '@org/shop-data';
import { useProfile } from './ProfileProvider';
import { useServerJoinedTeam } from './ServerJoinedTeamProvider';
import { useServerState } from './ServerStateProvider';

interface MeetingContextType {
  localStream: MediaStream | null;
  remoteStreams: any[];
  isSpeaking: boolean;
  remoteVoices: Record<string, boolean>;
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
  const { teamMembers } = useServerState();
  const profileIds = useMemo(
    () =>
      [
        profile?.userId,
        profile?.id,
        profile?.user_id,
        profile?.accountId,
        profile?.memberId,
        profile?.teamMemberId,
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean),
    [profile]
  );
  const normalizedProfileNames = useMemo(
    () =>
      [
        profile?.name,
        (profile as any)?.userName,
        (profile as any)?.nickName,
        (profile as any)?.nickname,
      ]
        .map((value) => String(value ?? '').trim().toLowerCase())
        .filter(Boolean),
    [profile]
  );
  const myMemberInfo = useMemo(
    () =>
      teamMembers.find((member: any) => {
        const memberIds = [
          member?.userId,
          member?.user_id,
          member?.accountId,
          member?.user?.id,
          member?.user?.userId,
          member?.user?.user_id,
          member?.user?.accountId,
          member?.teamMemberId,
          member?.memberId,
          member?.id,
        ]
          .map((value) => String(value ?? '').trim())
          .filter(Boolean);

        if (memberIds.some((value) => profileIds.includes(value))) {
          return true;
        }

        const memberNames = [
          member?.name,
          member?.nickname,
          member?.nickName,
          member?.user?.name,
          member?.user?.nickname,
          member?.user?.nickName,
        ]
          .map((value) => String(value ?? '').trim().toLowerCase())
          .filter(Boolean);

        return memberNames.some((value) => normalizedProfileNames.includes(value));
      }),
    [normalizedProfileNames, profileIds, teamMembers]
  );
  const meetingIdentity = useMemo(
    () => {
      const member = myMemberInfo as any;
      return (
      String(
        member?.teamMemberId ||
          member?.memberId ||
          member?.userId ||
          member?.user_id ||
          member?.user?.id ||
          member?.user?.userId ||
          member?.user?.user_id ||
          profile?.userId ||
          profile?.id ||
          profile?.user_id ||
          profile?.accountId ||
          ''
      ).trim()
      );
    },
    [myMemberInfo, profile]
  );
  const localIds = useMemo(
    () => Array.from(new Set([meetingIdentity, ...profileIds].filter(Boolean))),
    [meetingIdentity, profileIds]
  );

  const { meeting } = useServerJoinedTeam();

  // Only activate WebRTC if there is an active meeting and we have our ID
  // We use teamId from the store (set by Header or other triggers)
  const webrtc = useMeetingWebRTC(teamId, meetingIdentity, localIds, meeting);

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
