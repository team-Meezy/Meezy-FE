import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_HOST, WS_PROTOCOL } from '../axios';

export type MeetingEventType =
  | 'participant-joined'
  | 'participant-left'
  | 'meeting-ended';

export interface MeetingEvent {
  type: MeetingEventType;
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
  useEffect(() => {
    if (!teamId || !WS_HOST) return;

    const currentProtocol =
      typeof window !== 'undefined' ? window.location.protocol : 'n/a';
    const brokerURL = `${WS_PROTOCOL}://${WS_HOST}/ws`;

    console.log('Meeting Events Debug:', {
      windowProtocol: currentProtocol,
      WS_PROTOCOL: WS_PROTOCOL,
      WS_HOST: WS_HOST,
      finalURL: brokerURL,
    });

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP Meeting Events Debug:', str),
      onConnect: () => {
        console.log(`STOMP Connected to topic: /topic/meeting/${teamId}`);
        client.subscribe(`/topic/meeting/${teamId}`, (message) => {
          const event: MeetingEvent = JSON.parse(message.body);
          console.log(`Meeting Event Received: ${event.type}`, event);
          onEvent(event);
        });
      },
      onStompError: (frame) => {
        console.error(
          'STOMP Error in useMeetingEvents:',
          frame.headers['message']
        );
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [teamId, onEvent]);
}
