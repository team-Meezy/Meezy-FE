import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../axios';

export interface MeetingEvent {
  type: 'participant-joined' | 'participant-left' | 'meeting-ended';
  meetingId: string;
  joinedUserId?: string;
  joinedUserName?: string;
  joinedUserProfileImageUrl?: string;
  existingParticipantIds?: string[];
  leftUserId?: string;
}

export function useMeetingEvents(
  teamId: string,
  onEvent: (event: MeetingEvent) => void
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!teamId || !BASE_URL) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = `${BASE_URL}/ws`;

    console.log('Meeting Events SockJS Debug:', socketUrl);

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP Meeting Events Debug:', str),
      onConnect: () => {
        console.log(
          `STOMP Connected to topic: /topic/meeting/${teamId} (SockJS)`
        );
        client.subscribe(`/topic/meeting/${teamId}`, (message) => {
          const event: MeetingEvent = JSON.parse(message.body);
          console.log(`Meeting Event Received: ${event.type}`, event);
          onEventRef.current(event);
        });
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in useMeetingEvents:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('SockJS Error in useMeetingEvents:', event);
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [teamId]);
}
