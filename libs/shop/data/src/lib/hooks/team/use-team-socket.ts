import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useTeamSocket(teamId: string, onEvent?: (event: any) => void) {
  const client = useRef<Client | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = 'https://meezy.kr/ws-chat'; 

    console.log(' 📡 [Team Socket Attempt]', { teamId });

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(' ✅ [STOMP] Team Socket Connected:', teamId);

        // Subscribe to team-level events
        client.current?.subscribe(`/topic/teams/${teamId}`, (message: any) => {
          try {
            const event = JSON.parse(message.body);
            console.log(' 📩 [STOMP] Team Event Received:', event);

            if (onEvent) {
              onEvent(event);
            }
          } catch (err) {
            console.error(' [STOMP] Failed to parse team event:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error(' ❌ [STOMP] Team socket error:', frame.headers['message']);
      },
    });

    client.current.activate();

    return () => {
      console.log(' 🔌 [STOMP] Deactivating team socket:', teamId);
      client.current?.deactivate();
    };
  }, [teamId, onEvent]);
}
