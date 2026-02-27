import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useMeetingSignal,
  useMeetingEvents,
  SignalType,
  MeetingEvent,
} from '@org/shop-data';

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

  const removeParticipant = useCallback((userId: string) => {
    const pc = pcs.current.get(userId);
    if (pc) {
      pc.close();
      pcs.current.delete(userId);
    }
    setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
  }, []);

  const getOrCreatePC = useCallback(
    (targetUserId: string, isOfferer: boolean) => {
      if (pcs.current.has(targetUserId)) {
        return pcs.current.get(targetUserId)!;
      }

      console.log(`Creating PeerConnection for: ${targetUserId}`);
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

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          removeParticipant(targetUserId);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pcs.current.set(targetUserId, pc);
      return pc;
    },
    [myId, removeParticipant]
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
      if (toUserId !== myId) return;

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

  // 시그널링 외에 참가자 입장/퇴장 이벤트 처리
  const onMeetingEvent = useCallback(
    async (event: MeetingEvent) => {
      switch (event.type) {
        case 'participant-joined':
          if (event.joinedUserId && event.joinedUserId !== myId) {
            console.log(
              `New participant joined: ${event.joinedUserName} (${event.joinedUserId})`
            );
            // 나중에 들어온 사람에게 내가 먼저 Offer를 보내서 연결 시도 (Mesh 전략)
            // 혹은 서로 Offer를 보낼 수도 있는데, 보통 한쪽에서 시작함.
            connectToUser(event.joinedUserId);
          }
          break;
        case 'participant-left':
          if (event.leftUserId) {
            console.log(`Participant left: ${event.leftUserId}`);
            removeParticipant(event.leftUserId);
          }
          break;
        case 'meeting-ended':
          alert('회의가 종료되었습니다.');
          window.location.href = `/main/${teamId}`;
          break;
      }
    },
    [myId, teamId, removeParticipant]
  );

  useMeetingEvents(teamId, onMeetingEvent);

  useEffect(() => {
    const initLocalMedia = async () => {
      console.log('useMeetingWebRTC: Initializing local media for', myId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (error) {
        console.error('useMeetingWebRTC: Failed to get local media:', error);
      }
    };

    if (myId) initLocalMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
    };
  }, [myId]);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (targetUserId === myId) return;

      console.log(`Initiating connection to: ${targetUserId}`);
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
