import { useEffect, useRef } from 'react';
import { BASE_URL } from '../axios';
import {
  isSharedMeetingStompConnected,
  publishSharedMeetingMessage,
  releaseSharedMeetingStomp,
  retainSharedMeetingStomp,
  subscribeSharedMeetingTopic,
} from './shared-meeting-stomp';

interface VoiceActivity {
  userId: string;
  isSpeaking: boolean;
}

export function useMeetingVoiceActivity(
  meetingId: string,
  userId?: string,
  onActivity?: (activity: VoiceActivity) => void
) {
  const onActivityRef = useRef(onActivity);
  const pendingSpeakingStateRef = useRef<boolean | null>(null);
  const pendingVoiceCountRef = useRef(0);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    if (!meetingId || !BASE_URL) return;
    retainSharedMeetingStomp();
    const unsubscribe = subscribeSharedMeetingTopic(
      `/topic/meetings/${meetingId}/voice`,
      (message) => {
        if (!onActivityRef.current) {
          return;
        }

        const activity = JSON.parse(message.body);
        onActivityRef.current(activity);
      }
    );

    return () => {
      unsubscribe();
      releaseSharedMeetingStomp();
    };
  }, [meetingId]);

  return {
    sendVoiceActivity: (isSpeaking: boolean) => {
      pendingSpeakingStateRef.current = isSpeaking;

      if (isSharedMeetingStompConnected()) {
        if (isSpeaking) {
          publishSharedMeetingMessage({
            destination: `/app/meetings/${meetingId}/participation/voice`,
          });
        }

        if (userId) {
          publishSharedMeetingMessage({
            destination: `/app/meetings/${meetingId}/voice`,
            body: JSON.stringify({ userId, isSpeaking }),
          });
        }
        return;
      }

      if (isSpeaking) {
        pendingVoiceCountRef.current += 1;
      }

      while (pendingVoiceCountRef.current > 0) {
        publishSharedMeetingMessage({
          destination: `/app/meetings/${meetingId}/participation/voice`,
        });
        pendingVoiceCountRef.current -= 1;
      }

      if (userId) {
        publishSharedMeetingMessage({
          destination: `/app/meetings/${meetingId}/voice`,
          body: JSON.stringify({ userId, isSpeaking }),
        });
      }
    },
  };
}
