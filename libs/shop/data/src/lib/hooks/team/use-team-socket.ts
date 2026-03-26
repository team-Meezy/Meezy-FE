import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useTeamSocket(teamId: string, onEvent?: (event: any) => void) {
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!teamId) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = 'https://api.meezy.kr/ws-chat';

    clientRef.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        clientRef.current?.subscribe(`/topic/teams/${teamId}`, (message: any) => {
          try {
            const event = JSON.parse(message.body);
            onEventRef.current?.(event);
          } catch (error) {
            console.error('[STOMP] Failed to parse team event:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[STOMP] Team socket error:', frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] Team socket error:', event);
      },
    });

    clientRef.current.activate();

    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [teamId]);
}
