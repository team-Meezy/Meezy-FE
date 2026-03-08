'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  getMeetingSummary,
  getMeetingSummaries,
  getMeetingFeedback,
  getMeetingFeedbacks,
  getIndividualEngagement,
  getTotalEngagement,
} from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';
import { useServerJoinedTeam } from '../../../context';

export function MainRoomWrapper() {
  const params = useParams();
  const currentServerId = params.serverId as string;
  const { meetingId } = useMeetingStore();
  const fetchedRef = useRef<string | null>(null);
  const { joined, setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const [engagementMeetingId, setEngagementMeetingId] = useState<any>(null);
  const [participationRate, setParticipationRate] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!currentServerId || !meetingId) return;

    // 이미 해당 meetingId로 데이터를 성공적으로 다 가져왔다면 호출 방지
    if (fetchedRef.current === meetingId) return;

    console.log('MainRoomWrapper: Fetching summaries for', meetingId);

    let summaryPollingCount = 0;
    let feedbackPollingCount = 0;
    const MAX_POLLING_ATTEMPTS = 20; // 최대 20번 시도 (약 3분 20초)
    const POLLING_INTERVAL = 10000; // 10초 간격으로 폴링

    let summaryInterval: NodeJS.Timeout | null = null;
    let feedbackInterval: NodeJS.Timeout | null = null;
    let isSummaryFetched = false;
    let isFeedbackFetched = false;

    // Engagement 데이터는 즉시 1회만 호출
    const fetchEngagement = async () => {
      let fetchedMeetingId: string | null = null;

      try {
        const totalEngagement = await getTotalEngagement(
          currentServerId,
          meetingId
        );
        fetchedMeetingId = totalEngagement.meetingId;
        setEngagementMeetingId(fetchedMeetingId);
        console.log(totalEngagement, 'totalEngagement');
        console.log(fetchedMeetingId, 'totalEngagement.meetingId');
      } catch (error) {
        console.error('getTotalEngagement error', error);
      }

      if (!fetchedMeetingId) {
        console.warn('fetchedMeetingId is null, skipping individualEngagement');
        return;
      }

      try {
        const individualEngagement = await getIndividualEngagement(
          currentServerId,
          fetchedMeetingId
        );
        console.log(individualEngagement, 'individualEngagement');
        if (individualEngagement?.currentRate != null) {
          setParticipationRate(individualEngagement.currentRate);
        }
      } catch (error) {
        console.error('getIndividualEngagement error', error);
      }
    };

    fetchEngagement();

    // Summary 폴링 (전체 목록 조회 후, 해당 meetingId가 있는지 확인)
    const pollSummary = async () => {
      if (summaryPollingCount >= MAX_POLLING_ATTEMPTS || isSummaryFetched) {
        if (summaryInterval) clearInterval(summaryInterval);
        return;
      }
      summaryPollingCount++;
      try {
        const summariesList = await getMeetingSummaries(currentServerId);

        if (summariesList?.status === 404 || !Array.isArray(summariesList)) {
          console.log(
            `[Summary] List not yet available. Attempt ${summaryPollingCount}/${MAX_POLLING_ATTEMPTS}`
          );
          return;
        }

        // 전체 목록에서 현재 meetingId에 해당하는 요약본이 생성되었는지 찾기
        const targetSummary = summariesList.find(
          (s: any) => s.meetingId === meetingId
        );

        if (!targetSummary) {
          console.log(
            `[Summary] Target summary not found in list yet. Attempt ${summaryPollingCount}/${MAX_POLLING_ATTEMPTS}`
          );
          return;
        }

        console.log('Target meeting summary found:', targetSummary);

        // 상세 데이터가 더 필요하다면 여기서 단건 조회를 추가로 하거나, 바로 targetSummary를 리덕스 등에 저장하면 됩니다.
        // 현재는 생성 여부만 판단해 폴링을 종료합니다.

        isSummaryFetched = true;
        if (summaryInterval) clearInterval(summaryInterval);

        // 두 개 다 완료되었으면 fetchedRef 업데이트
        if (isSummaryFetched && isFeedbackFetched) {
          fetchedRef.current = meetingId;
        }
      } catch (error) {
        console.error('getMeetingSummaries error', error);
        if (summaryInterval) clearInterval(summaryInterval); // 404가 아닌 에러면 중단
      }
    };

    // Feedback 폴링 (전체 목록 조회 후, 해당 meetingId가 있는지 확인)
    const pollFeedback = async () => {
      if (feedbackPollingCount >= MAX_POLLING_ATTEMPTS || isFeedbackFetched) {
        if (feedbackInterval) clearInterval(feedbackInterval);
        return;
      }
      feedbackPollingCount++;
      try {
        const feedbacksList = await getMeetingFeedbacks(currentServerId);
        console.log(feedbacksList, 'feedbacksList');

        if (feedbacksList?.status === 404 || !Array.isArray(feedbacksList)) {
          console.log(
            `[Feedback] List not yet available. Attempt ${feedbackPollingCount}/${MAX_POLLING_ATTEMPTS}`
          );
          return;
        }

        // 전체 목록에서 현재 meetingId에 해당하는 피드백이 생성되었는지 찾기
        const targetFeedback = feedbacksList.find(
          (f: any) => f.meetingId === meetingId
        );

        if (!targetFeedback) {
          console.log(
            `[Feedback] Target feedback not found in list yet. Attempt ${feedbackPollingCount}/${MAX_POLLING_ATTEMPTS}`
          );
          return;
        }

        console.log('Target meeting feedback found:', targetFeedback);

        isFeedbackFetched = true;
        if (feedbackInterval) clearInterval(feedbackInterval);

        // 두 개 다 완료되었으면 fetchedRef 업데이트
        if (isSummaryFetched && isFeedbackFetched) {
          fetchedRef.current = meetingId;
        }
      } catch (error) {
        console.error('getMeetingFeedbacks error', error);
        if (feedbackInterval) clearInterval(feedbackInterval); // 404가 아닌 에러면 중단
      }
    };

    // 최초 1회 즉시 실행
    pollSummary();
    pollFeedback();

    summaryInterval = setInterval(pollSummary, POLLING_INTERVAL);
    feedbackInterval = setInterval(pollFeedback, POLLING_INTERVAL);

    // 언마운트 시 클린업
    return () => {
      if (summaryInterval) clearInterval(summaryInterval);
      if (feedbackInterval) clearInterval(feedbackInterval);
    };
  }, [currentServerId, meetingId, meeting]);

  // URL 파라미터가 아예 없는 경우 방어 로직
  if (!currentServerId) {
    return <div>접근할 수 없는 페이지입니다.</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <MainRoomPage />
    </div>
  );
}
