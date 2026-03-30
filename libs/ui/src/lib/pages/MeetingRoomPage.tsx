'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  MeetingEvent,
  useMeetingEvents,
  useMeetingStore,
} from '@org/shop-data';
import { useMeeting, useProfile, useServerState } from '../../context';
import Kamera from '../../assets/Kamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Nokamera from '../../assets/Nokamera.svg';
import { VideoCard } from './VideoCard';

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

export const MeetingRoomPage = () => {
  const router = useRouter();
  const params = useParams();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const { setTeamId, setMeetingId, setIceServers } = useMeetingStore();
  const currentTeamId = params.serverId as string;
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

  const [isMike, setIsMike] = useState(true);
  const [isKamera, setIsKamera] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);

  const {
    localStream,
    remoteStreams,
    isSpeaking,
    remoteVoices,
    initLocalMedia,
  } = useMeeting();

  const normalizeName = useCallback((name?: string | null) => {
    return (name || '').trim().toLowerCase();
  }, []);

  const getParticipantId = useCallback((participant: any) => {
    return getMeetingUserId(participant);
  }, []);

  const myComparableNames = useMemo(() => {
    return [
      profile?.name,
      (profile as any)?.userName,
      (profile as any)?.nickName,
    ]
      .map(normalizeName)
      .filter(Boolean);
  }, [normalizeName, profile]);

  const myMemberInfo = useMemo(() => {
    return teamMembers.find((member: any) => {
      const memberIds = [
        member?.userId,
        member?.user_id,
        member?.accountId,
        member?.memberId,
        member?.teamMemberId,
        member?.id,
        member?.user?.id,
        member?.user?.userId,
        member?.user?.user_id,
        member?.user?.accountId,
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
        .map(normalizeName)
        .filter(Boolean);

      return memberNames.some((value) => myComparableNames.includes(value));
    });
  }, [myComparableNames, normalizeName, profileIds, teamMembers]);

  const localIds = useMemo(() => {
    const member = myMemberInfo as any;
    return Array.from(
      new Set(
        [
          getMeetingUserId(member),
          getMeetingUserId(member?.user),
          getMeetingUserId(profile),
          getUserIdFromAccessToken(),
        ]
          .map((value) => String(value ?? '').trim())
          .filter(Boolean)
      )
    );
  }, [myMemberInfo, profile]);
  const myId = localIds[0] || '';

  const isCurrentUser = useCallback(
    (participant: any) => {
      const participantId = getParticipantId(participant);
      if (participantId) {
        return localIds.includes(String(participantId));
      }

      const participantName = normalizeName(
        participant?.name ||
          participant?.user?.name ||
          participant?.userName ||
          participant?.nickName
      );
      return myComparableNames.includes(participantName);
    },
    [getParticipantId, localIds, myComparableNames, normalizeName]
  );

  const hasLiveVideoTrack = useCallback((stream?: MediaStream | null) => {
    if (!stream) return false;

    return stream
      .getVideoTracks()
      .some((track) => track.readyState === 'live' && track.enabled);
  }, []);

  useEffect(() => {
    if (!currentTeamId || localIds.length === 0) return;

    setTeamId(currentTeamId);

    const fetchParticipants = async () => {
      try {
        const res = await getActiveMeetings(currentTeamId);
        if (res?.meetingId) {
          setMeetingId(res.meetingId);
        }
        setIceServers(Array.isArray(res?.iceServers) ? res.iceServers : []);
        if (Array.isArray(res?.participants)) {
          setParticipants(res.participants);
        } else {
          setParticipants([]);
        }
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };

    void fetchParticipants();
    const intervalId = setInterval(() => {
      void fetchParticipants();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [currentTeamId, localIds.length, setIceServers, setMeetingId, setTeamId]);

  const handleMeetingEvent = useCallback(
    (event: MeetingEvent) => {
      console.log('MeetingRoomPage: [EVENT]', event);

      if (event.type === 'participant-joined') {
        const joinedId = event.joinedUserId;

        if (joinedId && !localIds.includes(String(joinedId))) {
          setParticipants((prev) => {
            const exists = prev.some(
              (participant) =>
                String(getParticipantId(participant)) === String(joinedId)
            );

            if (exists) return prev;

            return [
              ...prev,
              {
                userId: joinedId,
                name: event.joinedUserName || '참가자',
                profileImageUrl: event.joinedUserProfileImageUrl,
              },
            ];
          });
        }
        return;
      }

      if (event.type === 'participant-left') {
        const leftId = event.leftUserId;
        if (leftId) {
          setParticipants((prev) =>
            prev.filter(
              (participant) =>
                String(getParticipantId(participant)) !== String(leftId)
            )
          );
        }
        return;
      }

      if (event.type === 'meeting-ended') {
        alert('회의가 종료되었습니다.');
        router.push(`/main/${currentTeamId}`);
      }
    },
    [currentTeamId, getParticipantId, localIds, router]
  );

  useMeetingEvents(currentTeamId, handleMeetingEvent);

  const onMikeClick = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMike(audioTrack.enabled);
      }
      return;
    }

    const stream = await initLocalMedia();
    if (stream) {
      setIsMike(true);
    }
  };

  const onKameraClick = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsKamera(videoTrack.enabled);
      }
      return;
    }

    const stream = await initLocalMedia();
    if (stream) {
      setIsKamera(true);
    }
  };

  const others = participants.filter(
    (participant) => !isCurrentUser(participant)
  );

  const remoteOnlyParticipants = remoteStreams.reduce<any[]>((acc, remote) => {
    const remoteId = String(remote.userId);

    if (localIds.includes(remoteId)) {
      return acc;
    }

    const existsInParticipants = others.some(
      (participant) => String(getParticipantId(participant)) === remoteId
    );
    const existsInAccumulator = acc.some(
      (participant) => String(getParticipantId(participant)) === remoteId
    );

    if (existsInParticipants || existsInAccumulator) {
      return acc;
    }

    return [
      ...acc,
      {
        userId: remote.userId,
        name: '참가자',
      },
    ];
  }, []);

  const allParticipants = [
    {
      id: myId,
      name: `${profile?.name || '나'} (나)`,
      isLocal: true,
      stream: localStream,
      isSpeaking,
      isMike,
      isKamera,
      onMikeClick,
      onKameraClick,
    },
    ...[...others, ...remoteOnlyParticipants].map((participant) => {
      const participantId = getParticipantId(participant);
      const remoteStream = remoteStreams.find(
        (stream) => String(stream.userId) === String(participantId)
      );

      return {
        id: participantId || participant.name,
        name: participant.name || '참가자',
        isLocal: false,
        stream: remoteStream?.stream,
        isSpeaking: !!remoteVoices[String(participantId)],
        isMike: true,
        isKamera: hasLiveVideoTrack(remoteStream?.stream),
        onMikeClick: () => {},
        onKameraClick: () => {},
      };
    }),
  ].filter((participant, index, list) => {
    if (participant.isLocal) return true;

    if (participant.id != null && localIds.includes(String(participant.id))) {
      return false;
    }

    if (myComparableNames.includes(normalizeName(participant.name))) {
      return false;
    }

    return (
      index ===
      list.findIndex(
        (candidate) =>
          String(candidate.id) === String(participant.id) &&
          candidate.isLocal === participant.isLocal
      )
    );
  });

  useEffect(() => {
    console.log(
      '[MeetingRoomPage] participant render snapshot',
      allParticipants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        isLocal: participant.isLocal,
        hasStream: Boolean(participant.stream),
        audioTracks: (participant.stream as MediaStream | undefined)?.getAudioTracks().map((track: MediaStreamTrack) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: (track as any).muted,
        })),
        videoTracks: (participant.stream as MediaStream | undefined)?.getVideoTracks().map((track: MediaStreamTrack) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: (track as any).muted,
        })),
        isKamera: participant.isKamera,
      }))
    );
  }, [allParticipants]);

  const total = allParticipants.length;

  const getRows = () => {
    if (total <= 1) return [allParticipants];
    if (total === 2) return [[allParticipants[0]], [allParticipants[1]]];
    if (total === 3) return [allParticipants.slice(0, 2), [allParticipants[2]]];
    if (total === 4)
      return [allParticipants.slice(0, 2), allParticipants.slice(2, 4)];
    if (total === 5) {
      return [
        allParticipants.slice(0, 2),
        allParticipants.slice(2, 4),
        [allParticipants[4]],
      ];
    }

    const rows = [];
    for (let i = 0; i < allParticipants.length; i += 3) {
      rows.push(allParticipants.slice(i, i + 3));
    }
    return rows;
  };

  const rows = getRows();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0c0c0c] overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 min-h-0 space-y-8 w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-1 w-full gap-8 items-center justify-center min-h-0"
          >
            {row.map((participant) => (
              <div
                key={String(participant.id)}
                className="flex-1 h-full min-h-0"
              >
                <VideoCard
                  name={participant.name}
                  isLocal={participant.isLocal}
                  isSpeaking={participant.isSpeaking}
                  isMike={participant.isMike}
                  isKamera={participant.isKamera}
                  videoStream={participant.stream}
                  onMikeClick={participant.onMikeClick}
                  onKameraClick={participant.onKameraClick}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pb-12 pt-4 px-10 flex justify-center w-full z-10 shrink-0">
        <div className="bg-[#1e1e1e]/80 rounded-[32px] py-6 px-12 flex items-center justify-center gap-6 relative w-full max-w-4xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-xl">
          <button
            className={`p-5 rounded-2xl transition-all group ${isMike ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/20 hover:bg-red-500/30'}`}
            onClick={onMikeClick}
          >
            <Image
              src={isMike ? Mike : NoMike}
              alt="Mike"
              width={28}
              height={28}
              className="opacity-90 group-hover:scale-110 transition-transform"
            />
          </button>
          <button
            className={`p-5 rounded-2xl transition-all group ${isKamera ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/20 hover:bg-red-500/30'}`}
            onClick={onKameraClick}
          >
            <Image
              src={isKamera ? Kamera : Nokamera}
              alt="Kamera"
              width={28}
              height={28}
              className="opacity-90 group-hover:scale-110 transition-transform"
            />
          </button>

          <button className="absolute right-12 text-white/40 hover:text-white transition-colors">
            <span className="text-3xl font-light cursor-pointer">
              ⛶
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
