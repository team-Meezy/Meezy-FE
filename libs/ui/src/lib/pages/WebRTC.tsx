'use client';

import { useEffect, useRef } from 'react';

interface WebRTCProps {
  stream: MediaStream | null;
  isLocal?: boolean;
}

export default function WebRTC({ stream, isLocal }: WebRTCProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        style={{
          transform: isLocal ? 'scaleX(-1)' : 'none',
          objectFit: 'contain',
        }}
        className="w-full h-full bg-black"
      />
    </div>
  );
}
