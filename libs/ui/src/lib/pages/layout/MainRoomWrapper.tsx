'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';

export function MainRoomWrapper() {
  const params = useParams();
  const serverId = params.serverId as string; // UUID는 문자열입니다.

  // 1. URL 파라미터가 아예 없는 경우 방어 로직
  if (!serverId) {
    return <div>접근할 수 없는 페이지입니다.</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 이제 여기서 리스트를 뒤지지 않고, 
         MainRoomPage 내부에서 serverId로 직접 API를 호출하여 
         데이터가 없으면 404 처리를 하도록 합니다.
      */}
      <MainRoomPage serverId={serverId} />
    </div>
  );
}
