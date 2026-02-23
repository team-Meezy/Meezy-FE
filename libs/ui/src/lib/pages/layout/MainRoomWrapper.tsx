'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';

export function MainRoomWrapper() {
  const params = useParams();
  const currentServerId = params.serverId as string;

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
