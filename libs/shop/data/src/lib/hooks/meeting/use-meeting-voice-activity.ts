import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

export function useMeetingVoiceActivity(meetingId: string, myId: string) {
  const client = useRef<Client | null>(null);
  const BASE_URL = process.env.VITE_BASE_URL;

  useEffect(() => {
    if (!meetingId || !myId) return;

    client.current = new Client({
      brokerURL: `wss://${BASE_URL}/ws`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP Connected for Voice Activity');
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
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [meetingId, myId, BASE_URL]);

  const sendVoiceActivity = useCallback(() => {
    if (client.current?.connected) {
      client.current.publish({
        destination: `/app/meetings/${meetingId}/participation/voice`,
        body: JSON.stringify({ userId: myId }),
      });
    }
  }, [meetingId, myId]);

  return { sendVoiceActivity };
}
