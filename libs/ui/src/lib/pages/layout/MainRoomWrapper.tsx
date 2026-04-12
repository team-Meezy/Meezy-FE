'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  getActiveMeetings,
  getMeetingSummaries,
  getMeetingFeedbacks,
  getIndividualEngagement,
} from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';
import { useServerJoinedTeam } from '../../../context';
import { MainRoomPage } from '../MainRoomPage';

export function MainRoomWrapper() {
  const params = useParams();
  const currentServerId = params.serverId as string;
  const { meetingId, teamId, lastEndedMeetingId, lastEndedTeamId } =
    useMeetingStore();
  const fetchedRef = useRef<string | null>(null);
  const { meeting } = useServerJoinedTeam();

  useEffect(() => {
    if (!currentServerId) return;

    const persistedLastEndedMeeting =
      typeof window !== 'undefined'
        ? (() => {
            try {
              const rawValue = sessionStorage.getItem('meezy:last-ended-meeting');

              if (!rawValue) {
                return { meetingId: '', teamId: '' };
              }

              const parsed = JSON.parse(rawValue) as {
                meetingId?: string;
                teamId?: string;
              };

              return {
                meetingId: String(parsed?.meetingId ?? '').trim(),
                teamId: String(parsed?.teamId ?? '').trim(),
              };
            } catch {
              return { meetingId: '', teamId: '' };
            }
          })()
        : { meetingId: '', teamId: '' };

    let cancelled = false;

    const prefetchParticipation = async () => {
      let targetMeetingId =
        teamId === currentServerId && meetingId ? meetingId : '';

      if (!targetMeetingId) {
        try {
          const activeMeeting = await getActiveMeetings(currentServerId);
          targetMeetingId = String(activeMeeting?.meetingId ?? '').trim();
        } catch (error) {
          console.error('Failed to fetch active meeting on team route change:', error);
        }
      }

      if (!targetMeetingId) {
        targetMeetingId =
          lastEndedTeamId === currentServerId && lastEndedMeetingId
            ? lastEndedMeetingId
            : persistedLastEndedMeeting.teamId === currentServerId
            ? persistedLastEndedMeeting.meetingId
            : '';
      }

      if (!targetMeetingId || cancelled) return;

      try {
        await getIndividualEngagement(currentServerId, targetMeetingId);
      } catch (error) {
        console.error('Failed to prefetch participation on team route change:', error);
      }
    };

    void prefetchParticipation();

    return () => {
      cancelled = true;
    };
  }, [
    currentServerId,
    lastEndedMeetingId,
    lastEndedTeamId,
    meetingId,
    teamId,
  ]);

  useEffect(() => {
    if (!currentServerId || !meetingId) return;
    if (fetchedRef.current === meetingId) return;

    let summaryPollingCount = 0;
    let feedbackPollingCount = 0;
    const MAX_POLLING_ATTEMPTS = 20;
    const POLLING_INTERVAL = 10000;

    let summaryInterval: NodeJS.Timeout | null = null;
    let feedbackInterval: NodeJS.Timeout | null = null;
    let isSummaryFetched = false;
    let isFeedbackFetched = false;

    const pollSummary = async () => {
      if (summaryPollingCount >= MAX_POLLING_ATTEMPTS || isSummaryFetched) {
        if (summaryInterval) clearInterval(summaryInterval);
        return;
      }
      summaryPollingCount++;

      try {
        const summariesList = await getMeetingSummaries(currentServerId);

        if (!Array.isArray(summariesList)) {
          return;
        }

        const targetSummary = summariesList.find(
          (summary) => summary.meetingId === meetingId
        );

        if (!targetSummary) {
          return;
        }

        isSummaryFetched = true;
        if (summaryInterval) clearInterval(summaryInterval);

        if (isSummaryFetched && isFeedbackFetched) {
          fetchedRef.current = meetingId;
        }
      } catch (error) {
        console.error('getMeetingSummaries error', error);
        if (summaryInterval) clearInterval(summaryInterval);
      }
    };

    const pollFeedback = async () => {
      if (feedbackPollingCount >= MAX_POLLING_ATTEMPTS || isFeedbackFetched) {
        if (feedbackInterval) clearInterval(feedbackInterval);
        return;
      }
      feedbackPollingCount++;

      try {
        const feedbacksList = await getMeetingFeedbacks(currentServerId);

        if (!Array.isArray(feedbacksList)) {
          return;
        }

        const targetFeedback = feedbacksList.find(
          (feedback) => feedback.meetingId === meetingId
        );

        if (!targetFeedback) {
          return;
        }

        isFeedbackFetched = true;
        if (feedbackInterval) clearInterval(feedbackInterval);

        if (isSummaryFetched && isFeedbackFetched) {
          fetchedRef.current = meetingId;
        }
      } catch (error) {
        console.error('getMeetingFeedbacks error', error);
        if (feedbackInterval) clearInterval(feedbackInterval);
      }
    };

    void pollSummary();
    void pollFeedback();

    summaryInterval = setInterval(() => {
      void pollSummary();
    }, POLLING_INTERVAL);
    feedbackInterval = setInterval(() => {
      void pollFeedback();
    }, POLLING_INTERVAL);

    return () => {
      if (summaryInterval) clearInterval(summaryInterval);
      if (feedbackInterval) clearInterval(feedbackInterval);
    };
  }, [currentServerId, meetingId, meeting]);

  if (!currentServerId) {
    return <div>잘못된 서버 접근입니다.</div>;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <MainRoomPage />
    </div>
  );
}
