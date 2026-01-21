'use client';

import { MainRoomPage, useServerState } from '@meezy/ui';
import { projectSidebarList } from '../context/list';
import { useParams } from 'next/navigation';

export default function TeamPage() {
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
