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
      entity?.accountId ||
      entity?.memberId ||
      entity?.teamMemberId ||
      entity?.user?.userId ||
      entity?.user?.user_id ||
      entity?.user?.accountId ||
      entity?.user?.memberId ||
      entity?.user?.teamMemberId ||
      entity?.user?.id ||
      entity?.id ||
      ''
  ).trim();
}

function getMeetingUserIds(entity: any) {
  return Array.from(
    new Set(
      [
        entity?.userId,
        entity?.user_id,
        entity?.accountId,
        entity?.memberId,
        entity?.teamMemberId,
        entity?.id,
        entity?.user?.userId,
        entity?.user?.user_id,
        entity?.user?.accountId,
        entity?.user?.memberId,
        entity?.user?.teamMemberId,
        entity?.user?.id,
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
    )
  );
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
  const teamMemberList = useMemo(
    () => (Array.isArray(teamMembers) ? teamMembers : []),
    [teamMembers]
  );
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
    remoteMediaStates,
    isSpeaking,
    remoteVoices,
    initLocalMedia,
    toggleAudioEnabled,
    toggleVideoEnabled,
  } = useMeeting();

  const normalizeName = useCallback((name?: string | null) => {
    return (name || '').trim().toLowerCase();
  }, []);

  const getParticipantId = useCallback((participant: any) => {
    return getMeetingUserId(participant);
  }, []);

  const getParticipantIds = useCallback((participant: any) => {
    return getMeetingUserIds(participant);
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
    return teamMemberList.find((member: any) => {
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
  }, [myComparableNames, normalizeName, profileIds, teamMemberList]);

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

  const hasEnabledAudioTrack = useCallback((stream?: MediaStream | null) => {
    if (!stream) return false;

    return stream
      .getAudioTracks()
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
                name: event.joinedUserName || '',
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
      const nextEnabled = !hasEnabledAudioTrack(localStream);
      const applied = await toggleAudioEnabled(nextEnabled);
      setIsMike(applied);
      return;
    }

    const stream = await initLocalMedia();
    if (stream) {
      setIsMike(true);
    }
  };

  const onKameraClick = async () => {
    if (localStream) {
      const nextEnabled = !hasLiveVideoTrack(localStream);
      const applied = await toggleVideoEnabled(nextEnabled);
      setIsKamera(applied);
      return;
    }

    const stream = await initLocalMedia();
    if (stream) {
      setIsKamera(true);
    }
  };

  useEffect(() => {
    setIsMike(hasEnabledAudioTrack(localStream));
    setIsKamera(hasLiveVideoTrack(localStream));
  }, [hasEnabledAudioTrack, hasLiveVideoTrack, localStream]);

  const others = participants.filter(
    (participant) => !isCurrentUser(participant)
  );

  const getRemoteMediaState = useCallback(
    (participant: any, remoteUserId?: string) => {
      const candidateIds = Array.from(
        new Set(
          [...getParticipantIds(participant), String(remoteUserId ?? '').trim()].filter(Boolean)
        )
      );

      for (const candidateId of candidateIds) {
        const mediaState = remoteMediaStates[candidateId];
        if (mediaState) {
          return mediaState;
        }
      }

      return null;
    },
    [getParticipantIds, remoteMediaStates]
  );

  const remoteOnlyParticipants = remoteStreams.reduce<any[]>((acc, remote) => {
    const remoteId = String(remote.userId);

    if (localIds.includes(remoteId)) {
      return acc;
    }

    const existsInParticipants = others.some(
      (participant) => getParticipantIds(participant).includes(remoteId)
    );
    const existsInAccumulator = acc.some(
      (participant) => getParticipantIds(participant).includes(remoteId)
    );

    if (existsInParticipants || existsInAccumulator) {
      return acc;
    }

    return [
      ...acc,
      {
        userId: remote.userId,
        name: '',
      },
    ];
  }, []);

  const allParticipants = [
    {
      id: myId,
      name: `${profile?.name || '나'} (나)`,
      isLocal: true,
      mirrorVideo: true,
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
        (stream) =>
          getParticipantIds(participant).includes(String(stream.userId)) ||
          String(stream.userId) === String(participantId)
      );
      const remoteMediaState = getRemoteMediaState(participant, remoteStream?.userId);

      return {
        id: participantId || participant.name,
        name: participant.name || '',
        isLocal: false,
        mirrorVideo: false,
        stream: remoteStream?.stream,
        isSpeaking: !!remoteVoices[String(participantId)],
        isMike:
          remoteMediaState?.audioEnabled ??
          hasEnabledAudioTrack(remoteStream?.stream),
        isKamera:
          remoteMediaState?.videoEnabled ??
          hasLiveVideoTrack(remoteStream?.stream),
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
        audioTracks: (participant.stream as MediaStream | undefined)
          ?.getAudioTracks()
          .map((track: MediaStreamTrack) => ({
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: (track as any).muted,
          })),
        videoTracks: (participant.stream as MediaStream | undefined)
          ?.getVideoTracks()
          .map((track: MediaStreamTrack) => ({
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
  const gridClassName = (() => {
    if (total <= 2) {
      return 'grid-cols-1';
    }

    if (total === 3) {
      return 'grid-cols-1 lg:grid-cols-2';
    }

    if (total === 4) {
      return 'grid-cols-1 md:grid-cols-2';
    }

    return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3';
  })();

  const getCardWrapperClassName = (index: number) => {
    if (total === 1) {
      return 'min-h-[260px] sm:min-h-[320px] lg:min-h-[400px]';
    }

    if (total === 2) {
      return 'min-h-[180px] sm:min-h-[210px] lg:min-h-[230px]';
    }

    if (total === 3) {
      return index === 0
        ? 'min-h-[180px] sm:min-h-[220px] lg:col-span-2 lg:min-h-[240px]'
        : 'min-h-[170px] sm:min-h-[190px] lg:min-h-[200px]';
    }

    if (total === 4) {
      return 'min-h-[170px] sm:min-h-[190px] lg:min-h-[210px]';
    }

    return 'min-h-[150px] sm:min-h-[170px] xl:min-h-[190px]';
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#0c0c0c]">
      <div className="flex-1 min-h-0 w-full overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div
          className={`mx-auto grid h-full w-full max-w-6xl auto-rows-fr gap-3 sm:gap-4 lg:gap-5 ${gridClassName}`}
        >
          {allParticipants.map((participant, index) => (
            <div
              key={`${participant.isLocal ? 'local' : 'remote'}:${String(
                participant.id || participant.name
              )}`}
              className={`min-h-0 ${getCardWrapperClassName(index)}`}
            >
              <VideoCard
                name={participant.name}
                isLocal={participant.isLocal}
                mirrorVideo={participant.mirrorVideo}
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
      </div>

      <div className="flex w-full shrink-0 justify-center px-4 pb-4 pt-2 sm:px-6 sm:pb-5 lg:px-8 lg:pb-6">
        <div className="relative flex w-full max-w-3xl items-center justify-center gap-3 rounded-[22px] border border-white/5 bg-[#1e1e1e]/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-4 sm:rounded-[24px] sm:px-6 sm:py-3.5 lg:gap-5 lg:px-8 lg:py-4">
          <button
            className="group rounded-xl p-2 transition-all hover:opacity-80 sm:p-2.5"
            onClick={onMikeClick}
          >
            <Image
              src={isMike ? Mike : NoMike}
              alt="Mike"
              width={24}
              height={24}
              className="opacity-90 transition-transform group-hover:scale-110"
            />
          </button>
          <button
            className="group rounded-xl p-2 transition-all hover:opacity-80 sm:p-2.5"
            onClick={onKameraClick}
          >
            <Image
              src={isKamera ? Kamera : Nokamera}
              alt="Kamera"
              width={24}
              height={24}
              className="opacity-90 transition-transform group-hover:scale-110"
            />
          </button>

          <button className="absolute right-4 text-white/40 transition-colors hover:text-white sm:right-6 lg:right-8">
            <span className="cursor-pointer text-lg font-light sm:text-xl">
              []
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
