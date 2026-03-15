'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useMeeting, useProfile } from '../../context';
import { useMeetingStore } from '@org/shop-data';
import { colors, typography } from '../../design';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';

export function MiniMeetingOverlay() {
  const { meetingId, teamId } = useMeetingStore();
  const { localStream, remoteStreams, isSpeaking, startRecording, stopRecording } = useMeeting();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Conditions to show overlay:
  // 1. Meeting must be active (meetingId exists)
  // 2. We must NOT be on the meeting page itself
  const isMeetingPage = pathname.includes('/meeting');
  if (!meetingId || isMeetingPage) return null;

  // Determine whose video to show (prioritize remote speakers, otherwise local)
  const activeRemote = remoteStreams[0]?.stream;
  const displayStream = activeRemote || localStream;
  const displayName = activeRemote ? (remoteStreams[0]?.name || '참가자') : '나';

  useEffect(() => {
    if (videoRef.current && displayStream) {
      videoRef.current.srcObject = displayStream;
    }
  }, [displayStream]);

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
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/80 backdrop-blur-sm">
                {displayName}
             </span>
             <button 
                onClick={handleReturn}
                className="text-[10px] bg-primary-500 hover:bg-primary-600 px-2 py-0.5 rounded text-white transition-colors"
                style={{ backgroundColor: colors.primary[500] }}
             >
                복귀
             </button>
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
