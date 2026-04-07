'use client';

import { useEffect, useMemo, useRef } from 'react';

interface WebRTCProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  mirror?: boolean;
}

export default function WebRTC({
  stream,
  isLocal,
  mirror = false,
}: WebRTCProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const videoStream = useMemo(() => {
    if (!stream) return null;
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [stream]);

  const audioStream = useMemo(() => {
    if (!stream || isLocal) return null;
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [isLocal, stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoStream) return;

    video.srcObject = videoStream;
    video.muted = true;

    const playVideo = async () => {
      try {
        await video.play();
        console.log('[WebRTCView] video playback started', {
          isLocal,
          audioTracks: stream?.getAudioTracks().length ?? 0,
          videoTracks: stream?.getVideoTracks().length ?? 0,
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('[WebRTCView] video playback failed', {
            isLocal,
            error,
          });
        }
      }
    };

    void playVideo();
    video.onloadedmetadata = () => {
      void playVideo();
    };

    return () => {
      video.onloadedmetadata = null;
    };
  }, [isLocal, stream, videoStream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioStream) return;

    audio.srcObject = audioStream;
    audio.muted = false;
    audio.volume = 1;

    const playAudio = async () => {
      try {
        await audio.play();
        console.log('[WebRTCView] audio playback started');
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('[WebRTCView] audio playback failed', error);
        }
      }
    };

    void playAudio();
    audio.onloadedmetadata = () => {
      void playAudio();
    };

    return () => {
      audio.onloadedmetadata = null;
    };
  }, [audioStream]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          transform: mirror ? 'scaleX(-1)' : 'none',
          objectFit: 'contain',
        }}
        className="w-full h-full bg-black"
      />
      {!isLocal && <audio ref={audioRef} autoPlay playsInline className="hidden" />}
    </div>
  );
}
