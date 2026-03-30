'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
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

function getMeetingUserId(entity: any) {
  return String(
    entity?.userId ||
      entity?.user_id ||
      entity?.user?.userId ||
      entity?.user?.user_id ||
      entity?.user?.id ||
      entity?.id ||
      ''
  ).trim();
}

function getUserIdFromAccessToken() {
  if (typeof window === 'undefined') return '';

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return '';

    const payload = token.split('.')[1];
    if (!payload) return '';

    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return String(
      decoded?.userId ||
        decoded?.user_id ||
        decoded?.id ||
        decoded?.sub ||
        decoded?.accountId ||
        ''
    ).trim();
  } catch (error) {
    return '';
  }
}

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  console.log('[DEBUG] MeetingProvider body executing');
  const { meetingId, teamId } = useMeetingStore();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const teamMemberList = useMemo(
    () => (Array.isArray(teamMembers) ? teamMembers : []),
    [teamMembers]
  );
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
        .map((value) =>
          String(value ?? '')
            .trim()
            .toLowerCase()
        )
        .filter(Boolean),
    [profile]
  );
  const myMemberInfo = useMemo(
    () =>
      teamMemberList.find((member: any) => {
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
          .map((value) =>
            String(value ?? '')
              .trim()
              .toLowerCase()
          )
          .filter(Boolean);

        return memberNames.some((value) =>
          normalizedProfileNames.includes(value)
        );
      }),
    [normalizedProfileNames, profileIds, teamMemberList]
  );
  const signalingIdentity = useMemo(() => {
    return (
      getMeetingUserId(myMemberInfo) ||
      getMeetingUserId((myMemberInfo as any)?.user) ||
      getMeetingUserId(profile) ||
      getUserIdFromAccessToken()
    );
  }, [myMemberInfo, profile]);
  const localIds = useMemo(() => {
    const member = myMemberInfo as any;
    return Array.from(
      new Set(
        [
          signalingIdentity,
          getMeetingUserId(member),
          getMeetingUserId(member?.user),
          getMeetingUserId(profile),
          getUserIdFromAccessToken(),
        ]
          .map((value) => String(value ?? '').trim())
          .filter(Boolean)
      )
    );
  }, [myMemberInfo, profileIds, signalingIdentity, profile]);

  const { meeting } = useServerJoinedTeam();

  // Only activate WebRTC if there is an active meeting and we have our ID
  // We use teamId from the store (set by Header or other triggers)
  useEffect(() => {
    console.log('[DEBUG] MeetingProvider state:', {
      teamId,
      signalingIdentity,
      localIds,
      meetingStatus: meeting,
    });
  }, [teamId, signalingIdentity, localIds, meeting]);

  useEffect(() => {
    console.log('[DEBUG] MeetingProvider identity sources:', {
      profile: {
        id: profile?.id,
        userId: profile?.userId,
        user_id: profile?.user_id,
        accountId: profile?.accountId,
        memberId: (profile as any)?.memberId,
        teamMemberId: (profile as any)?.teamMemberId,
      },
      myMemberInfo: myMemberInfo
        ? {
            id: (myMemberInfo as any)?.id,
            userId: (myMemberInfo as any)?.userId,
            user_id: (myMemberInfo as any)?.user_id,
            accountId: (myMemberInfo as any)?.accountId,
            memberId: (myMemberInfo as any)?.memberId,
            teamMemberId: (myMemberInfo as any)?.teamMemberId,
            user: {
              id: (myMemberInfo as any)?.user?.id,
              userId: (myMemberInfo as any)?.user?.userId,
              user_id: (myMemberInfo as any)?.user?.user_id,
              accountId: (myMemberInfo as any)?.user?.accountId,
            },
          }
        : null,
    });
  }, [myMemberInfo, profile]);

  const isWebRTCActive = Boolean(teamId && meetingId && signalingIdentity);
  const webrtc = useMeetingWebRTC(
    teamId,
    signalingIdentity,
    localIds,
    isWebRTCActive
  );

  const value = useMemo(
    () => ({
      ...webrtc,
    }),
    [webrtc]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
