import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_HOST, WS_PROTOCOL } from '../axios';

export function useMeetingChatActivity(meetingId: string, myId: string) {
  const client = useRef<Client | null>(null);

  useEffect(() => {
    if (!meetingId || !myId || !WS_HOST) return;

    const protocol =
      typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? 'wss'
        : 'ws';
    const brokerURL = `${protocol}://${WS_HOST}/ws`;
    console.log('Chat Activity WebSocket Attempt:', brokerURL);

    client.current = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('STOMP Chat Activity Debug:', str),
      onConnect: () => {
        console.log('STOMP Connected for Chat Activity');
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in Chat Activity:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error in Chat Activity:', event);
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [meetingId, myId]);

  const sendChatActivity = useCallback(() => {
    if (client.current?.connected) {
      client.current.publish({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
    }
  }, [meetingId, myId]);

  return { sendChatActivity };
}
