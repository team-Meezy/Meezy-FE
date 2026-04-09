import { useEffect, useRef } from 'react';
import { BASE_URL } from '../axios';
import {
  releaseSharedMeetingStomp,
  retainSharedMeetingStomp,
  subscribeSharedMeetingTopic,
} from './shared-meeting-stomp';

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
    retainSharedMeetingStomp();
    const unsubscribe = subscribeSharedMeetingTopic(
      `/topic/meeting/${teamId}`,
      (message) => {
        const event: MeetingEvent = JSON.parse(message.body);
        onEventRef.current(event);
      }
    );

    return () => {
      unsubscribe();
      releaseSharedMeetingStomp();
    };
  }, [teamId]);
}
