'use client';

import { VideoCard } from './VideoCard';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';
import { useServerJoinedTeam, useProfile, useMeeting } from '../../context';
import { useParams, useRouter } from 'next/navigation';
import { getActiveMeetings, useMeetingEvents, MeetingEvent } from '@org/shop-data';
import { useCallback } from 'react';

export const MeetingRoomPage = () => {
  const router = useRouter();
  const { profile } = useProfile();
  const params = useParams();
  const currentTeamId = params.serverId as string;
  const myId =
    profile?.userId || profile?.id || profile?.user_id || profile?.accountId;

  const [isMike, setIsMike] = useState(true);
  const [isKamera, setIsKamera] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);

  const {
    localStream,
    remoteStreams,
    isSpeaking,
    remoteVoices,
    isRecording,
    connectToUser,
    initLocalMedia,
    startRecording,
    stopRecording,
  } = useMeeting();

  const hasLiveVideoTrack = useCallback((stream?: MediaStream | null) => {
    if (!stream) return false;

    return stream
      .getVideoTracks()
      .some((track) => track.readyState === 'live' && track.enabled);
  }, []);

  // 참가자 목록 가져오기 (UI 리스트 업데이트 전용)
  useEffect(() => {
    if (!currentTeamId || !myId) return;

    const fetchParticipants = async () => {
      try {
        const res = await getActiveMeetings(currentTeamId);
        if (res?.participants && Array.isArray(res.participants)) {
          setParticipants(res.participants);
          // Signaling은 useMeetingWebRTC 내부에서 WebSocket 이벤트를 통해 자동 처리됨
        }
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };

    fetchParticipants();
  }, [currentTeamId, myId]);

  const handleMeetingEvent = useCallback(
    (event: MeetingEvent) => {
      console.log('MeetingRoomPage: [EVENT]', event);
      if (event.type === 'participant-joined') {
        const pId = event.joinedUserId;
        if (pId && pId !== myId) {
          setParticipants((prev) => {
            const exists = prev.some(
              (p) => (p.userId || p.id || p.user_id) === pId
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                userId: event.joinedUserId,
                name: event.joinedUserName,
                profileImageUrl: event.joinedUserProfileImageUrl,
              },
            ];
          });
        }
      } else if (event.type === 'participant-left') {
        const pId = event.leftUserId;
        if (pId) {
          setParticipants((prev) =>
            prev.filter((p) => (p.userId || p.id || p.user_id) !== pId)
          );
        }
      } else if (event.type === 'meeting-ended') {
        alert('회의가 종료되었습니다.');
        router.push(`/main/${currentTeamId}`);
      }
    },
    [myId, currentTeamId, router]
  );

  useMeetingEvents(currentTeamId, handleMeetingEvent);

  const onMikeClick = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMike(audioTrack.enabled);
      }
    } else {
      const stream = await initLocalMedia();
      if (stream) {
        setIsMike(true);
      }
    }
  };

  const onKameraClick = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsKamera(videoTrack.enabled);
      }
    } else {
      const stream = await initLocalMedia();
      if (stream) {
        setIsKamera(true);
      }
    }
  };

  const others = Array.isArray(participants)
    ? participants.filter((p) => {
        const id = p.userId || p.id || p.user_id;
        const myIdentifier = String(myId);
        const pIdentifier = String(id);
        
        // 내 ID와 일치하거나, 이름이 동일하면서 로컬 유저로 추정되는 경우 필터링
        const isMeById = id && pIdentifier === myIdentifier;
        const isMeByName = p.name === profile?.name || p.name?.includes('(나)');
        
        return !isMeById && !isMeByName;
      })
    : [];

  const allParticipants = [
    {
      id: myId,
      name: `${profile?.name || '나'} (나)`,
      isLocal: true,
      stream: localStream,
      isSpeaking: isSpeaking,
      isMike: isMike,
      isKamera: isKamera,
      onMikeClick,
      onKameraClick,
    },
    ...others.map((p) => {
      const pId = p.userId || p.id || p.user_id;
      const rs = Array.isArray(remoteStreams)
        ? remoteStreams.find((s: any) => String(s.userId) === String(pId))
        : null;
      return {
        id: pId,
        name: p.name || '참가자',
        isLocal: false,
        stream: rs?.stream,
        isSpeaking: !!remoteVoices[String(pId)],
        isMike: true,
        isKamera: hasLiveVideoTrack(rs?.stream),
        onMikeClick: () => {},
        onKameraClick: () => {},
      };
    }),
  ];

  const total = allParticipants.length;

  // 행(Row)별 데이터 구성
  const getRows = () => {
    if (total <= 1) return [allParticipants];
    if (total === 2) return [[allParticipants[0]], [allParticipants[1]]];
    if (total === 3) return [allParticipants.slice(0, 2), [allParticipants[2]]];
    if (total === 4) return [allParticipants.slice(0, 2), allParticipants.slice(2, 4)];
    if (total === 5)
      return [
        allParticipants.slice(0, 2),
        allParticipants.slice(2, 4),
        [allParticipants[4]],
      ];
    // 6명 이상은 대략적으로 3개씩 끊음
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
            {row.map((p) => (
              <div key={String(p.id)} className="flex-1 h-full max-w-2xl min-h-0">
                <VideoCard
                  name={p.name}
                  isSpeaking={p.isSpeaking}
                  isMike={p.isMike}
                  isKamera={p.isKamera}
                  videoStream={p.stream}
                  onMikeClick={p.onMikeClick}
                  onKameraClick={p.onKameraClick}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 하단 컨트롤 바 */}
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
