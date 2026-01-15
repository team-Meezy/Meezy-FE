'use client';

import { TeamJoin } from './TeamJoin';
import { TeamJoined } from './TeamJoined';
import { useServerJoinedTeam } from '../context/ServerJoinedTeamProvider';

export function LayoutPage() {
  const { joined } = useServerJoinedTeam();
  return <>{joined ? <TeamJoined /> : <TeamJoin />}</>;
}
