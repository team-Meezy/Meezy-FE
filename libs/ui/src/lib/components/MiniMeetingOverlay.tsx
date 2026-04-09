'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useMeeting, useServerJoinedTeam } from '../../context';
import { useMeetingStore, useLoadingStore, leaveMeeting } from '@org/shop-data';
import { colors } from '../../design';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';

function formatDisplayName(name: string) {
  const trimmedName = String(name ?? '').trim();

  if (trimmedName.length <= 4) {
    return trimmedName;
  }

  return `${trimmedName.slice(0, 4)}...`;
}

export function MiniMeetingOverlay() {
  const { meetingId, setMeetingId, teamId, setTeamId, setLastEndedMeeting } =
    useMeetingStore();
  const {
    localStream,
    remoteStreams,
    isSpeaking,
    toggleAudioEnabled,
    toggleVideoEnabled,
  } = useMeeting();
  const { setMeeting } = useServerJoinedTeam();
  const { setLoading, setLoadingState } = useLoadingStore();
  const pathname = usePathname();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeRemote = remoteStreams?.[0]?.stream;
  const displayStream = activeRemote || localStream;
  const displayName = formatDisplayName(
    activeRemote ? remoteStreams[0]?.name || '참가자' : '나'
  );

  const isMeetingPage = pathname.includes('/meeting');
  const isMikeEnabled =
    localStream?.getAudioTracks().some(
      (track) => track.readyState === 'live' && track.enabled
    ) ?? false;
  const isKameraEnabled =
    localStream?.getVideoTracks().some(
      (track) => track.readyState === 'live' && track.enabled
    ) ?? false;

  useEffect(() => {
    if (videoRef.current && displayStream) {
      videoRef.current.srcObject = displayStream;
    }
  }, [displayStream, isMeetingPage]);

  if (!meetingId || isMeetingPage) return null;

  const toggleMike = () => {
    if (localStream) {
      void toggleAudioEnabled(!isMikeEnabled);
    }
  };

  const toggleKamera = () => {
    if (localStream) {
      void toggleVideoEnabled(!isKameraEnabled);
    }
  };

  const handleReturn = () => {
    router.push(`/main/${teamId}/meeting`);
  };

  const handleExit = async () => {
    setLoading(true);
    setLoadingState('회의 내용을 저장 중입니다...');
    window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));

    try {
      if (meetingId) {
        setLastEndedMeeting(meetingId, teamId);
      }
      await leaveMeeting(teamId);
      setMeeting(false);
      setMeetingId('');
      setTeamId('');
    } catch (error) {
      console.log('leaveMeeting error', error);
      alert('회의 나가기에 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex aspect-video w-64 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-2xl group">
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!activeRemote}
          style={{
            transform: !activeRemote ? 'scaleX(-1)' : 'none',
          }}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-start justify-between">
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
              {displayName}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handleExit}
                className="rounded bg-red-500 px-2 py-0.5 text-[10px] text-white transition-colors hover:bg-red-600"
              >
                나가기
              </button>
              <button
                onClick={handleReturn}
                className="rounded px-2 py-0.5 text-[10px] text-white transition-colors hover:bg-primary-600"
                style={{ backgroundColor: colors.primary[500] }}
              >
                복귀
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={toggleMike}
              className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            >
              <Image
                src={isMikeEnabled ? Mike : NoMike}
                alt="mike"
                width={14}
                height={14}
              />
            </button>
            <button
              onClick={toggleKamera}
              className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            >
              <Image
                src={isKameraEnabled ? Kamera : Nokamera}
                alt="camera"
                width={14}
                height={14}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 bg-[#1e1e1e] px-3 py-1.5">
        <span className="truncate text-[10px] font-medium text-white/60">
          통화 중...
        </span>
        {isSpeaking && (
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>
    </div>
  );
}
