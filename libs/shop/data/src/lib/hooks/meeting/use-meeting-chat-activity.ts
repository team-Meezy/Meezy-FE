import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

export function useMeetingChatActivity(meetingId: string, myId: string) {
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
        console.log('STOMP Connected for Chat Activity');
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in Chat Activity:',
          frame.headers['message']
        );
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [meetingId, myId, BASE_URL]);

  const sendChatActivity = useCallback(() => {
    if (client.current?.connected) {
      client.current.publish({
        destination: `/app/meetings/${meetingId}/participation/chat`,
        body: JSON.stringify({ userId: myId }),
      });
    }
  }, [meetingId, myId]);

  return { sendChatActivity };
}
