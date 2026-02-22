'use client';

import { MainRoomPage } from '../MainRoomPage';
import { useParams } from 'next/navigation';
import { useServerIdStore } from '@org/shop-data';
import { useEffect } from 'react';

export function MainRoomWrapper() {
  const params = useParams();
  const { serverId, setServerId } = useServerIdStore();
  useEffect(() => {
    setServerId(params.serverId as string);
  }, [params.serverId]);

  // 1. URL 파라미터가 아예 없는 경우 방어 로직
  if (!serverId) {
    return <div>접근할 수 없는 페이지입니다.</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <MainRoomPage />
    </div>
  );
}
