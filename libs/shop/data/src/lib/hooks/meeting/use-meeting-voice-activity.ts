import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_HOST, WS_PROTOCOL } from '../axios';

export function useMeetingVoiceActivity(meetingId: string, myId: string) {
  const client = useRef<Client | null>(null);

  useEffect(() => {
    if (!meetingId || !myId || !WS_HOST) return;

    const currentProtocol =
      typeof window !== 'undefined' ? window.location.protocol : 'n/a';
    const brokerURL = `${WS_PROTOCOL}://${WS_HOST}/ws`;

    console.log('Voice Activity Debug:', {
      windowProtocol: currentProtocol,
      WS_PROTOCOL: WS_PROTOCOL,
      WS_HOST: WS_HOST,
      finalURL: brokerURL,
    });

    client.current = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('STOMP Voice Activity Debug:', str),
      onConnect: () => {
        console.log('✅✅✅ STOMP Connected for Voice Activity');
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in Voice Activity:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error in Voice Activity:', event);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket Closed in Voice Activity:', event);
      },
    });
    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [meetingId, myId]);

  const sendVoiceActivity = useCallback(() => {
    if (client.current?.connected) {
      console.log('📣 Sending Voice Activity to Backend...');
      client.current.publish({
        destination: `/app/meetings/${meetingId}/participation/voice`,
      });
    } else {
      console.warn('⚠️ Cannot send Voice Activity: STOMP not connected');
    }
  }, [meetingId, myId]);

  return { sendVoiceActivity };
}
