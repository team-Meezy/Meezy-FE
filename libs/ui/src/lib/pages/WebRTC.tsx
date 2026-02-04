'use client';

import { useWebRTC } from '../../hooks/index';

export default function WebRTC() {
  const { videoRef } = useWebRTC('1');
  return (
    <div className="flex-1 flex flex-col gap-10" style={{ padding: 20 }}>
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
        style={{
          width: '400px',
          height: '300px',
        }}
      />
    </div>
  );
}
