import {
  LayoutPage,
  ServerCreateProvider,
  ServerJoinedTeamProvider,
} from '@meezy/ui';

export default function Page() {
  return (
    <ServerCreateProvider>
      <ServerJoinedTeamProvider>
        <LayoutPage />
      </ServerJoinedTeamProvider>
    </ServerCreateProvider>
  );
}
