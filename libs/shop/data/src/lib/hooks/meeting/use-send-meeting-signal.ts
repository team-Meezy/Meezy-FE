import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../axios';

export type SignalType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
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
  startedAt?: string;
}

export function useMeetingSignal(
  teamId: string,
  myId: string,
  onSignal: (signal: MeetingSignal) => void
) {
  const client = useRef<Client | null>(null);
  const onSignalRef = useRef(onSignal);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    if (!teamId || !myId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = `${BASE_URL}/ws`;

    console.log('Meeting Signaling SockJS Debug:', socketUrl);

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('STOMP Signaling Debug:', str),
      onConnect: () => {
        console.log('STOMP Connected for Signaling (SockJS)');

        client.current?.subscribe(
          `/user/queue/teams/${teamId}/meeting/signal`,
          (message) => {
            const signal = JSON.parse(message.body);
            onSignalRef.current(signal);
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error in Signaling:', event);
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [teamId, myId]);

  return {
    sendSignal: (toUserId: string, signal: any) => {
      if (client.current?.connected) {
        client.current.publish({
          destination: `/app/teams/${teamId}/meeting/signal`,
          body: JSON.stringify(signal),
        });
      }
    },
  };
}
