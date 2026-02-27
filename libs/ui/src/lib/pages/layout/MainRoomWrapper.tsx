'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { getMeetingSummary } from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';

export function MainRoomWrapper() {
  const params = useParams();
  const currentServerId = params.serverId as string;
  const { meetingId } = useMeetingStore();

  useEffect(() => {
    if (!currentServerId || !meetingId) return;

    console.log(currentServerId, meetingId, 'currentServerId, meetingId');

    const fetchSummary = async () => {
      try {
        const meetingSummary = await getMeetingSummary(
          currentServerId,
          meetingId
        );
        console.log(meetingSummary, 'meetingSummary');
      } catch (error) {
        console.error('getMeetingSummary error', error);
      }
    };

    fetchSummary();
  }, [currentServerId, meetingId]);

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
