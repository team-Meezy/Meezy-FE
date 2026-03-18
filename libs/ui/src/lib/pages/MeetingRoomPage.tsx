'use client';

import { VideoCard } from './VideoCard';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';
import { useServerJoinedTeam, useProfile, useMeeting } from '../../context';
import { useParams } from 'next/navigation';
import { getActiveMeetings } from '@org/shop-data';

export const MeetingRoomPage = () => {
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
    isRecording,
    connectToUser,
    initLocalMedia,
    startRecording,
    stopRecording,
  } = useMeeting();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // 로컬 스트림 연결
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 참가자 목록 가져오기 및 초기 연결 시도
  useEffect(() => {
    if (!currentTeamId || !myId) return;

    const fetchParticipants = async () => {
      try {
        const res = await getActiveMeetings(currentTeamId);
        if (res?.participants && Array.isArray(res.participants)) {
          setParticipants(res.participants);

          // 나보다 먼저 들어와 있는 사람들에게 Offer 보내기
          if (Array.isArray(res.participants)) {
            res.participants.forEach((p: any) => {
              const pId = p.userId || p.id || p.user_id;
              if (pId !== myId) {
                // 내 ID가 상대방보다 작을 때만 Offer 시작 (Glare 방지)
                if (myId < pId) {
                  console.log(`Initial polite initiation: sending offer to ${pId}`);
                  connectToUser(pId);
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };

    fetchParticipants();

    // 주기적으로 참가자 명단 갱신 (또는 소켓 이벤트 대기)
    const interval = setInterval(fetchParticipants, 30000);
    return () => clearInterval(interval);
  }, [currentTeamId, myId, connectToUser]);

  const onMikeClick = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMike(audioTrack.enabled);
      }
    } else {
      // 스트림이 없으면 다시 시도
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
      // 스트림이 없으면 다시 시도
      const stream = await initLocalMedia();
      if (stream) {
        setIsKamera(true);
      }
    }
  };

  const others = Array.isArray(participants)
    ? participants.filter((p) => {
        const id = p.userId || p.id || p.user_id;
        return String(id) !== String(myId);
      })
    : [];

  const totalParticipants = 1 + others.length;

  const getGridCols = () => {
    if (totalParticipants <= 1) return 'grid-cols-1';
    if (totalParticipants <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    return 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#121212] overflow-hidden relative">
      {/* 녹음 상태 인디케이터 */}
      {isRecording && (
        <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-red-500/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-xs font-bold tracking-wider">REC</span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-0">
        {totalParticipants === 1 ? (
          <div className="w-full h-full flex items-center justify-center max-w-6xl mx-auto">
            <VideoCard
              name={`${profile?.name || '나'} (나)`}
              isSpeaking={isSpeaking}
              isMike={isMike}
              isKamera={isKamera}
              videoStream={localStream}
              onMikeClick={onMikeClick}
              onKameraClick={onKameraClick}
            />
          </div>
        ) : (
          <div
            className={`grid ${getGridCols()} gap-4 w-full h-full max-w-5xl mx-auto`}
          >
            {/* 내 비디오 */}
            <div className="w-full h-full min-h-0 col-span-1">
              <VideoCard
                name={`${profile?.name || '나'} (나)`}
                isSpeaking={isSpeaking}
                isMike={isMike}
                isKamera={isKamera}
                videoStream={localStream}
                onMikeClick={onMikeClick}
                onKameraClick={onKameraClick}
              />
            </div>

            {/* 모든 참가자(나 제외) */}
            {others.map((p) => {
              const pId = p.userId || p.id || p.user_id;
              const rs = Array.isArray(remoteStreams)
                ? remoteStreams.find((s) => String(s.userId) === String(pId))
                : null;

              return (
                <div key={String(pId)} className="w-full h-full min-h-0 col-span-1">
                  <VideoCard
                    name={p.name || '참가자'}
                    isSpeaking={false} // 필요 시 VAD 정보 연동
                    isMike={true} // 필요 시 실제 상태 연동
                    isKamera={!!rs?.stream} // 스트림이 있을 때만 카메라 켜진 것으로 표시
                    videoStream={rs?.stream}
                    onMikeClick={() => {}}
                    onKameraClick={() => {}}
                  />
                </div>
              );
            })}
          </div>
        )}
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
