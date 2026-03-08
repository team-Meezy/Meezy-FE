'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  getMeetingSummary,
  getMeetingFeedback,
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

  useEffect(() => {
    if (!currentServerId || !meetingId) return;

    // 이미 해당 meetingId로 데이터를 가져왔다면 중복 호출 방지
    if (fetchedRef.current === meetingId) return;

    console.log('MainRoomWrapper: Fetching summaries for', meetingId);
    fetchedRef.current = meetingId;

    const fetchSummary = async () => {
      try {
        const meetingSummary = await getMeetingSummary(
          currentServerId,
          meetingId
        );
        console.log(meetingSummary, 'meetingSummary');
      } catch (error) {
        if ((error as any).response?.status === 404) {
          console.log('Meeting summary not yet available (404)');
        } else {
          console.error('getMeetingSummary error', error);
        }
      }

      try {
        const meetingFeedback = await getMeetingFeedback(
          currentServerId,
          meetingId
        );
        console.log(meetingFeedback, 'meetingFeedback');
      } catch (error) {
        if ((error as any).response?.status === 404) {
          console.log('Meeting feedback not yet available (404)');
        } else {
          console.error('getMeetingFeedback error', error);
        }
      }

      try {
        const individualEngagement = await getIndividualEngagement(
          currentServerId,
          meetingId
        );
        console.log(individualEngagement, 'individualEngagement');
      } catch (error) {
        console.error('getIndividualEngagement error', error);
      }

      try {
        const totalEngagement = await getTotalEngagement(
          currentServerId,
          meetingId
        );
        console.log(totalEngagement, 'totalEngagement');
      } catch (error) {
        console.error('getTotalEngagement error', error);
      }
    };

    fetchSummary();
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
