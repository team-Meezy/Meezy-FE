import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_HOST, WS_PROTOCOL } from '../axios';

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

  useEffect(() => {
    if (!teamId || !myId || !WS_HOST) return;

    const currentProtocol =
      typeof window !== 'undefined' ? window.location.protocol : 'n/a';
    const brokerURL = `${WS_PROTOCOL}://${WS_HOST}/ws`;

    console.log('Meeting Signaling Debug:', {
      windowProtocol: currentProtocol,
      WS_PROTOCOL: WS_PROTOCOL,
      WS_HOST: WS_HOST,
      finalURL: brokerURL,
    });

    client.current = new Client({
      brokerURL,
      debug: (str) => console.log('STOMP Signaling Debug:', str),
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
