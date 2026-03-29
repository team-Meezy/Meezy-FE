import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL, STOMP_SOCKET_URL } from '../axios';

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
    const socketUrl = `${STOMP_SOCKET_URL}${token ? `?token=${token}` : ''}`;

    console.log('[DEBUG] useMeetingEvents: attempting connection', {
      socketUrl,
      hasToken: !!token,
      teamId
    });

    const client = new Client({
      webSocketFactory: () => {
        console.log('[DEBUG] useMeetingEvents: SockJS factory called', socketUrl);
        const sock = new SockJS(socketUrl, null, {});
        sock.onopen = () => console.log('[DEBUG] useMeetingEvents: SockJS onopen');
        sock.onclose = (e) => console.log('[DEBUG] useMeetingEvents: SockJS onclose', e);
        sock.onerror = (e) => console.log('[DEBUG] useMeetingEvents: SockJS onerror', e);
        return sock;
      },
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

    console.log('[DEBUG] useMeetingEvents: calling activate()');
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [teamId]);
}
