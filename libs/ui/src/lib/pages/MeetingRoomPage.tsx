'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  MeetingEvent,
  useMeetingEvents,
  useMeetingStore,
} from '@org/shop-data';
import { useMeeting, useProfile } from '../../context';
import Kamera from '../../assets/Kamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Nokamera from '../../assets/Nokamera.svg';
import { VideoCard } from './VideoCard';

export const MeetingRoomPage = () => {
  const router = useRouter();
  const params = useParams();
  const { profile } = useProfile();
  const { setTeamId, setMeetingId } = useMeetingStore();
  const currentTeamId = params.serverId as string;
  const myId =
    profile?.userId || profile?.id || profile?.user_id || profile?.accountId;

  const [isMike, setIsMike] = useState(true);
  const [isKamera, setIsKamera] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);

  const { localStream, remoteStreams, isSpeaking, remoteVoices, initLocalMedia } =
    useMeeting();

  const getParticipantId = useCallback((participant: any) => {
    return participant?.userId || participant?.id || participant?.user_id;
  }, []);

  const isCurrentUser = useCallback(
    (participant: any) => {
      const participantId = getParticipantId(participant);
      if (participantId) {
        return String(participantId) === String(myId);
      }
      return participant?.name === profile?.name;
    },
    [getParticipantId, myId, profile?.name]
  );

  const hasLiveVideoTrack = useCallback((stream?: MediaStream | null) => {
    if (!stream) return false;

    return stream
      .getVideoTracks()
      .some((track) => track.readyState === 'live' && track.enabled);
  }, []);

  useEffect(() => {
    if (!currentTeamId || !myId) return;

    setTeamId(currentTeamId);

    const fetchParticipants = async () => {
      try {
        const res = await getActiveMeetings(currentTeamId);
        if (res?.meetingId) {
          setMeetingId(res.meetingId);
        }
        if (Array.isArray(res?.participants)) {
          setParticipants(res.participants);
        }
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };

    void fetchParticipants();
  }, [currentTeamId, myId, setMeetingId, setTeamId]);

  const handleMeetingEvent = useCallback(
    (event: MeetingEvent) => {
      console.log('MeetingRoomPage: [EVENT]', event);

      if (event.type === 'participant-joined') {
        const joinedId = event.joinedUserId;
        if (joinedId && joinedId !== myId) {
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
                name: event.joinedUserName || 'Participant',
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
    [currentTeamId, getParticipantId, myId, router]
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

  const others = participants.filter((participant) => !isCurrentUser(participant));

  const remoteOnlyParticipants = remoteStreams.reduce<any[]>((acc, remote) => {
    const remoteId = String(remote.userId);

    if (remoteId === String(myId)) {
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
        name: 'Participant',
      },
    ];
  }, []);

  const allParticipants = [
    {
      id: myId,
      name: `${profile?.name || 'Me'} (Me)`,
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
        id: participantId,
        name: participant.name || 'Participant',
        isLocal: false,
        stream: remoteStream?.stream,
        isSpeaking: !!remoteVoices[String(participantId)],
        isMike: true,
        isKamera: hasLiveVideoTrack(remoteStream?.stream),
        onMikeClick: () => {},
        onKameraClick: () => {},
      };
    }),
  ];

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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#121212] overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-0 space-y-4 max-w-6xl mx-auto w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-1 w-full gap-4 items-center justify-center min-h-0"
          >
            {row.map((participant) => (
              <div
                key={String(participant.id)}
                className="flex-1 h-full max-w-2xl min-h-0"
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

      <div className="bg-[#1e1e1e] rounded-2xl py-3 px-6 flex items-center justify-center relative w-full max-w-5xl mx-auto shrink-0 border border-white/10">
        <button
          className="p-3 hover:bg-[#333] rounded-full transition-all group"
          onClick={onMikeClick}
        >
          <Image
            src={isMike ? Mike : NoMike}
            alt="Mike"
            width={22}
            height={22}
          />
        </button>
        <button
          className="p-3 hover:bg-[#333] rounded-full transition-all shadow-lg"
          onClick={onKameraClick}
        >
          <Image
            src={isKamera ? Kamera : Nokamera}
            alt="Nokamera"
            width={22}
            height={22}
          />
        </button>

        <button className="absolute right-8 text-white/40 hover:text-white">
          <span className="text-2xl font-extralight tracking-tighter cursor-pointer">
            ⛶
          </span>
        </button>
      </div>
    </div>
  );
};
