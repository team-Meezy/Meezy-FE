import { useEffect, useRef } from 'react';
import { BASE_URL } from '../axios';
import {
  isSharedMeetingStompConnected,
  publishSharedMeetingMessage,
  releaseSharedMeetingStomp,
  retainSharedMeetingStomp,
  subscribeSharedMeetingTopic,
} from './shared-meeting-stomp';

export type SignalType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'media-state'
  | 'recording-started'
  | 'recording-stopped';

export interface MeetingSignal {
  type: SignalType;
  fromUserId: string;
  toUserId: string;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  startedAt?: string;
  elapsedMs?: number;
}

export function useMeetingSignal(
  teamId: string,
  myId: string,
  onSignal: (signal: MeetingSignal) => void
) {
  const onSignalRef = useRef(onSignal);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    if (!teamId || !myId || !BASE_URL) return;
    retainSharedMeetingStomp();
    const destination = `/topic/meeting/${teamId}/user/${myId}`;
    const unsubscribe = subscribeSharedMeetingTopic(destination, (message) => {
      try {
        const signal = JSON.parse(message.body);
        Promise.resolve(onSignalRef.current(signal)).catch(() => undefined);
      } catch {}
    });

    return () => {
      unsubscribe();
      releaseSharedMeetingStomp();
    };
  }, [teamId, myId]);

  return {
    sendSignal: (toUserId: string, signal: MeetingSignal) => {
      const payload = {
        ...signal,
        toUserId,
      };

      if (isSharedMeetingStompConnected()) {
        publishSharedMeetingMessage({
          destination: `/app/teams/${teamId}/meeting/signal`,
          body: JSON.stringify(payload),
        });
        return;
      }

      publishSharedMeetingMessage({
        destination: `/app/teams/${teamId}/meeting/signal`,
        body: JSON.stringify(payload),
      });
    },
  };
}
