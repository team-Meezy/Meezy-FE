import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';

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
    if (!teamId) return;

    const client = new Client({
      brokerURL: `wss://${process.env.VITE_BASE_URL}/ws`,
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
