import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../axios';

interface VoiceActivity {
  userId: string;
  isSpeaking: boolean;
}

export function useMeetingVoiceActivity(
  meetingId: string,
  userId?: string,
  onActivity?: (activity: VoiceActivity) => void
) {
  const client = useRef<Client | null>(null);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    if (!meetingId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = `${BASE_URL}/ws`;

    console.log('Voice Activity SockJS Debug:', socketUrl);

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP Voice Activity Debug:', str),
      onConnect: () => {
        console.log(
          `STOMP Connected for Voice Activity (SockJS): ${meetingId}`
        );

        if (onActivityRef.current) {
          client.current?.subscribe(
            `/topic/meetings/${meetingId}/voice`,
            (message) => {
              const activity = JSON.parse(message.body);
              onActivityRef.current?.(activity);
            }
          );
        }
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in Voice Activity:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('SockJS Error in Voice Activity:', event);
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [meetingId]);

  return {
    sendVoiceActivity: (isSpeaking: boolean) => {
      if (client.current?.connected && userId) {
        client.current.publish({
          destination: `/app/meetings/${meetingId}/voice`,
          body: JSON.stringify({ userId, isSpeaking }),
        });
      }
    },
  };
}
