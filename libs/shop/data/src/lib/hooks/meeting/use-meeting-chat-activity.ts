import { useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../axios';
import { logMeetingParticipation } from '../../recording-console';
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
      logMeetingParticipation('chat', 'send', {
        meetingId,
        destination: `/app/meetings/${meetingId}/participation/chat`,
        connected: true,
      });
      publishSharedMeetingMessage({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      return;
    }

    pendingSendCount.current += 1;
    logMeetingParticipation('chat', 'queued', {
      meetingId,
      destination: `/app/meetings/${meetingId}/participation/chat`,
      connected: false,
      pendingSendCount: pendingSendCount.current,
    });
    while (pendingSendCount.current > 0) {
      logMeetingParticipation('chat', 'send', {
        meetingId,
        destination: `/app/meetings/${meetingId}/participation/chat`,
        connected: false,
        flushedFromQueue: true,
        pendingSendCount: pendingSendCount.current,
      });
      publishSharedMeetingMessage({
        destination: `/app/meetings/${meetingId}/participation/chat`,
      });
      pendingSendCount.current -= 1;
    }
  }, [meetingId]);

  return { sendChatActivity };
}
