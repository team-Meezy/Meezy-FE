import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL, STOMP_SOCKET_URL } from '../axios';

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
  const pendingSignalsRef = useRef<MeetingSignal[]>([]);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    console.log('[DEBUG] useMeetingSignal check:', { teamId, myId, BASE_URL });
    if (!teamId || !myId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = `${STOMP_SOCKET_URL}${token ? `?token=${token}` : ''}`;

    console.log('[DEBUG] useMeetingSignal: attempting connection', {
      socketUrl,
      hasToken: !!token,
      teamId,
      myId
    });

    client.current = new Client({
      webSocketFactory: () => {
        console.log('[DEBUG] useMeetingSignal: SockJS factory called', socketUrl);
        const sock = new SockJS(socketUrl, null, {});
        sock.onopen = () => console.log('[DEBUG] useMeetingSignal: SockJS onopen');
        sock.onclose = (e) => console.log('[DEBUG] useMeetingSignal: SockJS onclose', e);
        sock.onerror = (e) => console.log('[DEBUG] useMeetingSignal: SockJS onerror', e);
        return sock;
      },
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
        console.log(
          'Subscribing to:',
          `/topic/meeting/${teamId}/user/${myId}`
        );

        if (pendingSignalsRef.current.length > 0) {
          const queuedSignals = [...pendingSignalsRef.current];
          pendingSignalsRef.current = [];

          queuedSignals.forEach((signal) => {
            client.current?.publish({
              destination: `/app/teams/${teamId}/meeting/signal`,
              body: JSON.stringify(signal),
            });
          });
        }

        client.current?.subscribe(
          `/topic/meeting/${teamId}/user/${myId}`,
          (message) => {
            try {
              const signal = JSON.parse(message.body);
              console.log('Meeting Signal Received (STOMP):', signal);
              Promise.resolve(onSignalRef.current(signal)).catch((error) => {
                console.error('Meeting Signal handler failed:', error, signal);
              });
            } catch (error) {
              console.error('Meeting Signal parse failed:', error, message.body);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP Error in Signaling:', frame.headers['message']);
        console.log('STOMP Error Frame:', frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error in Signaling:', event);
      },
    });

    console.log('[DEBUG] useMeetingSignal: calling activate()');
    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [teamId, myId]);

  return {
    sendSignal: (toUserId: string, signal: MeetingSignal) => {
      console.log('sendSignal invoked', {
        connected: client.current?.connected,
        toUserId,
        type: signal.type,
      });

      if (client.current?.connected) {
        console.log('Meeting Signal Sent (STOMP):', signal);
        client.current.publish({
          destination: `/app/teams/${teamId}/meeting/signal`,
          body: JSON.stringify(signal),
        });
        return;
      }

      console.log('Meeting Signal queued until STOMP connects:', signal);
      pendingSignalsRef.current.push({
        ...signal,
        toUserId,
      });
    },
  };
}
