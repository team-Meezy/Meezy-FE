'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMeetingSignal, SignalType } from '@org/shop-data';

interface ParticipantStream {
  userId: string;
  stream: MediaStream;
  name?: string;
}

export function useMeetingWebRTC(teamId: string, myId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<ParticipantStream[]>([]);

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const getOrCreatePC = useCallback(
    (targetUserId: string, isOfferer: boolean) => {
      if (pcs.current.has(targetUserId)) {
        return pcs.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            fromUserId: myId,
            toUserId: targetUserId,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || undefined,
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(
          'Received remote track from:',
          targetUserId,
          event.streams[0]
        );
        setRemoteStreams((prev) => {
          if (prev.find((ps) => ps.userId === targetUserId)) return prev;
          return [...prev, { userId: targetUserId, stream: event.streams[0] }];
        });
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pcs.current.set(targetUserId, pc);
      return pc;
    },
    [myId]
  );

  const onSignal = useCallback(
    async (signal: any) => {
      const {
        type,
        fromUserId,
        toUserId,
        sdp,
        candidate,
        sdpMid,
        sdpMLineIndex,
      } = signal;

      // 나에게 온 신호인지 확인
      if (toUserId !== myId) return;

      console.log(`Received signal: ${type} from ${fromUserId}`);

      if (type === 'offer') {
        const pc = getOrCreatePC(fromUserId, false);
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp })
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({
          type: 'answer',
          fromUserId: myId,
          toUserId: fromUserId,
          sdp: answer.sdp,
        });
      } else if (type === 'answer') {
        const pc = pcs.current.get(fromUserId);
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp })
          );
        }
      } else if (type === 'ice-candidate') {
        const pc = pcs.current.get(fromUserId);
        if (pc) {
          await pc.addIceCandidate(
            new RTCIceCandidate({
              candidate,
              sdpMid,
              sdpMLineIndex,
            })
          );
        }
      }
    },
    [myId, getOrCreatePC]
  );

  const { sendSignal } = useMeetingSignal(teamId, myId, onSignal);

  useEffect(() => {
    const initLocalMedia = async () => {
      console.log('useMeetingWebRTC: Initializing local media for', myId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log('useMeetingWebRTC: Local stream obtained:', stream.id);
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (error) {
        console.error('useMeetingWebRTC: Failed to get local media:', error);
      }
    };

    if (myId) initLocalMedia();

    return () => {
      console.log('useMeetingWebRTC: Cleaning up local media');
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
    };
  }, [myId]);

  // 외부(다른 참가자)에서 이 유저에게 연결을 시도하게 하려면
  // 누군가가 먼저 Offer를 보내야 합니다.
  // 여기서는 명시적으로 특정 유저에게 연결을 시작하는 함수를 제공합니다.
  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (targetUserId === myId) return;

      const pc = getOrCreatePC(targetUserId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'offer',
        fromUserId: myId,
        toUserId: targetUserId,
        sdp: offer.sdp,
      });
    },
    [myId, getOrCreatePC, sendSignal]
  );

  return {
    localStream,
    remoteStreams,
    connectToUser,
  };
}
