'use client';

import { MainRoomPage } from '../../MainRoomPage';
import { projectSidebarList } from '../../../../context';
import { useParams } from 'next/navigation';

export function MainRoomWrapper() {
  const params = useParams();
  const serverId = Number(params.serverId);

  const roomNameFind = Number.isNaN(serverId)
    ? null
    : projectSidebarList.find((room) => room.team_id === serverId)?.team_name ??
      null;

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {roomNameFind && <MainRoomPage />}
      </div>
    </>
  );
}
