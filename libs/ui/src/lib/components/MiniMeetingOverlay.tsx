'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useMeeting, useProfile, useServerJoinedTeam } from '../../context';
import { useMeetingStore, useLoadingStore, leaveMeeting } from '@org/shop-data';
import { colors, typography } from '../../design';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';

export function MiniMeetingOverlay() {
  const {
    meetingId,
    setMeetingId,
    teamId,
    setTeamId,
    setLastEndedMeeting,
  } = useMeetingStore();
  const { localStream, remoteStreams, isSpeaking, startRecording, stopRecording } = useMeeting();
  const { setMeeting } = useServerJoinedTeam();
  const { setLoading, setLoadingState } = useLoadingStore();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Determine whose video to show (prioritize remote speakers, otherwise local)
  const activeRemote = remoteStreams?.[0]?.stream;
  const displayStream = activeRemote || localStream;
  const displayName = activeRemote ? (remoteStreams[0]?.name || '참가자') : '나';

  const isMeetingPage = pathname.includes('/meeting');

  useEffect(() => {
    if (videoRef.current && displayStream) {
      videoRef.current.srcObject = displayStream;
    }
  }, [displayStream, isMeetingPage]);

  // Conditions to show overlay:
  // 1. Meeting must be active (meetingId exists)
  // 2. We must NOT be on the meeting page itself
  if (!meetingId || isMeetingPage) return null;

  const toggleMike = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
    }
  };

  const toggleKamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
    }
  };

  const handleReturn = () => {
    router.push(`/main/${teamId}/meeting`);
  };

  const handleExit = async () => {
    const now = new Date().toLocaleTimeString();
    console.log(`[${now}] MiniOverlay: [EXIT] Starting exit flow...`);
    setLoading(true);
    setLoadingState('회의 내용을 저장 중입니다...');
    window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));

    try {
      console.log(`[${now}] MiniOverlay: [EXIT] Calling leaveMeeting...`);
      if (meetingId) {
        setLastEndedMeeting(meetingId, teamId);
      }
      await leaveMeeting(teamId);
      setMeeting(false);
      setMeetingId('');
      setTeamId('');
      // The Header's auto-navigation logic will handle the redirect once uploading is complete.
    } catch (error) {
      console.log('leaveMeeting error', error);
      alert('회의 나가기에 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 w-64 aspect-video bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[100] group flex flex-col"
    >
      {/* Video Content */}
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!activeRemote}
          style={{
            transform: !activeRemote ? 'scaleX(-1)' : 'none',
          }}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/80 backdrop-blur-sm">
                {displayName}
             </span>
             <div className="flex gap-1.5">
               <button 
                  onClick={handleExit}
                  className="text-[10px] bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded text-white transition-colors"
               >
                  나가기
               </button>
               <button 
                  onClick={handleReturn}
                  className="text-[10px] hover:bg-primary-600 px-2 py-0.5 rounded text-white transition-colors"
                  style={{ backgroundColor: colors.primary[500] }}
               >
                  복귀
               </button>
             </div>
          </div>
          
          <div className="flex justify-center gap-4">
             <button onClick={toggleMike} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <Image src={Mike} alt="mike" width={14} height={14} />
             </button>
             <button onClick={toggleKamera} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <Image src={Kamera} alt="camera" width={14} height={14} />
             </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar (Always visible title) */}
      <div className="px-3 py-1.5 bg-[#1e1e1e] flex items-center justify-between border-t border-white/5">
         <span className="text-[10px] text-white/60 font-medium truncate">통화 중...</span>
          {isSpeaking && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      </div>
    </div>
  );
}
