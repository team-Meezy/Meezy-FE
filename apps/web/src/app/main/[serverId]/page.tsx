'use client';

import { MainRoom, useServerState } from '@meezy/ui';
import { projectSidebarList } from '../context/list';
import { useParams } from 'next/navigation';

export default function TeamPage() {
  const params = useParams();
  const serverId = Number(params.serverId);
  const { setFeedback, setSummary } = useServerState();

  const roomNameFind = Number.isNaN(serverId)
    ? null
    : projectSidebarList.find((room) => room.team_id === serverId)?.team_name ??
      null;

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {roomNameFind && (
          <MainRoom setFeedback={setFeedback} setSummary={setSummary} />
        )}
      </div>
    </>
  );
}
