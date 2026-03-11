import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../axios';

export function useMeetingChatActivity(meetingId: string, myId: string) {
  const client = useRef<Client | null>(null);

  useEffect(() => {
    if (!meetingId || !myId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = '/ws';
    console.log('Chat Activity SockJS Attempt:', socketUrl);

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token
        ? {
            Authorization: token,
          }
        : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('STOMP Chat Activity Debug:', str),
      onConnect: () => {
        console.log('STOMP Connected for Chat Activity (SockJS)');
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in Chat Activity:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('SockJS Error in Chat Activity:', event);
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
