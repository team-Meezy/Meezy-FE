import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

export type SignalType = 'offer' | 'answer' | 'ice-candidate';

interface MeetingSignal {
  type: SignalType;
  fromUserId: string;
  toUserId: string;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export function useMeetingSignal(
  teamId: string,
  myId: string,
  onSignal: (signal: MeetingSignal) => void
) {
  const client = useRef<Client | null>(null);
  const BASE_URL = process.env.VITE_BASE_URL;

  useEffect(() => {
    if (!teamId || !myId) return;

    client.current = new Client({
      brokerURL: `wss://${BASE_URL}/ws`,
      onConnect: () => {
        console.log('STOMP Connected for Signaling');

        client.current?.subscribe(
          `/user/queue/teams/${teamId}/meeting/signal`,
          (message) => {
            const signal = JSON.parse(message.body);
            onSignal(signal);
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [teamId, myId, onSignal]);

  const sendSignal = (signal: MeetingSignal) => {
    if (client.current?.connected) {
      client.current.publish({
        destination: `/app/teams/${teamId}/meeting/signal`,
        body: JSON.stringify(signal),
      });
    } else {
      console.warn(
        'STOMP client not connected. Failed to send signal:',
        signal.type
      );
    }
  };

  return { sendSignal };
}
