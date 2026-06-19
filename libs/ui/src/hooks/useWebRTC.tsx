'use client';

import { useRef } from 'react';
import { useWebSocketSignal } from './useWebSocketSignal';
import { usePeerConnection } from './usePeerConnection';
import { BASE_URL } from '@org/shop-data';

export function useWebRTC(teamId: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sendRef = useRef<((data: unknown) => void) | null>(null);

  const { pcRef, toggleVideo, toggleAudio, videoEnabled, audioEnabled } =
    usePeerConnection(videoRef, (candidate) => {
      if (sendRef.current) {
        sendRef.current({
          type: 'ice-candidate',
          candidate,
        });
      }
    });

  const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/app/teams/${teamId}/meeting/signal`;

  const { send } = useWebSocketSignal(
    wsUrl,
    async (data) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (data.type === 'offer') {
        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        send({ type: 'answer', sdp: answer.sdp });
      }

      if (data.type === 'answer') {
        await pc.setRemoteDescription(data);
      }

      if (data.type === 'ice-candidate') {
        await pc.addIceCandidate(data.candidate);
      }
    }
  );

  sendRef.current = send;

  return { videoRef, toggleVideo, toggleAudio, videoEnabled, audioEnabled };
}

export default useWebRTC;
