'use client';

import { useWebRTC } from '../../hooks/index';

export default function WebRTC() {
  const { videoRef } = useWebRTC('1');
  return (
    <div className="w-full h-full max-h-[120px] flex-1 flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={(e) => {
          console.log('onLoadedMetadata fired');
          const video = e.currentTarget;
          console.log('Video readyState:', video.readyState);
          video
            .play()
            .then(() => console.log('Video playing'))
            .catch((err) => console.error('Play failed:', err));
        }}
        className="w-[500px] h-[300px] object-cover"
      />
    </div>
  );
}
