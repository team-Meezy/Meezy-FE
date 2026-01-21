import { ServerProfilePage } from '@meezy/ui/client';
import { projectSidebarList, userList } from '@meezy/ui';

export default function ServerProfile() {
  return (
    <ServerProfilePage
      userList={userList}
      projectSidebarList={projectSidebarList}
    />
  );
}
