import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL, STOMP_SOCKET_URL } from '../axios';

export function useMeetingChatActivity(meetingId: string, myId: string) {
  const client = useRef<Client | null>(null);
  const pendingSendCount = useRef(0);

  useEffect(() => {
    if (!meetingId || !myId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = STOMP_SOCKET_URL;
    console.log('Chat Activity SockJS Attempt:', socketUrl);

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('STOMP Chat Activity Debug:', str),
      onConnect: () => {
        console.log('STOMP Connected for Chat Activity (SockJS)', {
          meetingId,
          myId,
          pendingSendCount: pendingSendCount.current,
        });

        while (pendingSendCount.current > 0 && client.current?.connected) {
          client.current.publish({
            destination: `/app/meetings/${meetingId}/participation/chat`,
          });
          pendingSendCount.current -= 1;
          console.log('[chat] flush-send', {
            meetingId,
            myId,
            remainingPending: pendingSendCount.current,
          });
        }
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
      pendingSendCount.current = 0;
      client.current?.deactivate();
    };
  }, [meetingId, myId]);

  const sendChatActivity = useCallback(() => {
    if (client.current?.connected) {
      console.log('[chat] send', {
        meetingId,
        myId,
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      client.current.publish({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      return;
    }

    pendingSendCount.current += 1;
    console.log('[chat] queued', {
      meetingId,
      myId,
      connected: client.current?.connected ?? false,
      pendingSendCount: pendingSendCount.current,
    });
  }, [meetingId, myId]);

  return { sendChatActivity };
}
