import { useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../axios';
import {
  isSharedMeetingStompConnected,
  publishSharedMeetingMessage,
  releaseSharedMeetingStomp,
  retainSharedMeetingStomp,
} from './shared-meeting-stomp';

export function useMeetingChatActivity(meetingId: string, myId: string) {
  const pendingSendCount = useRef(0);

  useEffect(() => {
    if (!meetingId || !BASE_URL) return;
    retainSharedMeetingStomp();

    return () => {
      pendingSendCount.current = 0;
      releaseSharedMeetingStomp();
    };
  }, [meetingId, myId]);

  const sendChatActivity = useCallback(() => {
    if (isSharedMeetingStompConnected()) {
      publishSharedMeetingMessage({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      return;
    }

    pendingSendCount.current += 1;
    while (pendingSendCount.current > 0) {
      publishSharedMeetingMessage({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      pendingSendCount.current -= 1;
    }
  }, [meetingId]);

  return { sendChatActivity };
}
