'use client';

import { TeamJoin } from './join/TeamJoin';
import { TeamJoined } from './joined/TeamJoined';
import { useServerJoinedTeam } from '../../../../../libs/ui/src/context/ServerJoinedTeamProvider';

export function LayoutPage() {
  const { joined } = useServerJoinedTeam();
  return <>{joined ? <TeamJoined /> : <TeamJoin />}</>;
}
