'use client';

import { VideoCard } from './VideoCard';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';
import { useMeetingWebRTC } from '../../hooks';
import { useServerJoinedTeam, useProfile } from '../../context';
import { useParams } from 'next/navigation';
import { getActiveMeetings, uploadMeetingRecording } from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';

export const MeetingRoomPage = () => {
  const { meeting } = useServerJoinedTeam();
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
    connectToUser,
    initLocalMedia,
  } = useMeetingWebRTC(currentTeamId, myId || '');
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const { meetingId } = useMeetingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTeamId || !meetingId) return;

    try {
      console.log('Testing upload with file:', file.name, file.size);
      alert('업로드를 시작합니다: ' + file.name);
      const res = await uploadMeetingRecording(currentTeamId, meetingId, file);
      console.log('Test upload success:', res);
      alert('업로드 성공!');
    } catch (error) {
      console.error('Test upload failed:', error);
      alert('업로드 실패: ' + (error as any).message);
    }
  };

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
        if (res?.participants) {
          setParticipants(res.participants);

          // 나보다 먼저 들어와 있는 사람들에게 Offer 보내기
          res.participants.forEach((p: any) => {
            const pId = p.userId || p.id || p.user_id;
            if (pId !== myId) {
              connectToUser(pId);
            }
          });
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

  const totalParticipants = 1 + remoteStreams.length;

  const getGridCols = () => {
    if (totalParticipants <= 2) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  console.log('MeetingRoomPage: profile', profile);
  console.log('MeetingRoomPage: myId', myId);
  console.log('MeetingRoomPage: localStream', !!localStream);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#121212] overflow-hidden">
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

            {/* 원격 비디오들 */}
            {remoteStreams.map((rs) => {
              const pInfo = participants.find(
                (p) => (p.userId || p.id || p.user_id) === rs.userId
              );
              return (
                <div
                  key={rs.userId}
                  className="w-full h-full min-h-0 col-span-1"
                >
                  <VideoCard
                    name={pInfo?.name || rs.userId}
                    isSpeaking={false}
                    isMike={true}
                    isKamera={true}
                    videoStream={rs.stream}
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

        {/* 테스트용 업로드 버튼 */}
        <div className="absolute left-8">
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            className="hidden"
            onChange={onTestUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] text-white/20 hover:text-white/60 border border-white/10 px-2 py-1 rounded"
          >
            Test Upload
          </button>
        </div>
      </div>
    </div>
  );
};
