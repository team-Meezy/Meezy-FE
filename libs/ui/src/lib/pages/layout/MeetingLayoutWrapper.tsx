'use client';

import { MeetingRoomPage } from '../MeetingRoomPage';

export function MeetingLayoutWrapper() {
  return (
    <div className="flex-1 flex flex-col items-stretch">
      {/* 필요시 여기에 상단 헤더나 룸 타이틀을 넣을 수 있습니다 */}
      <MeetingRoomPage />
    </div>
  );
}
