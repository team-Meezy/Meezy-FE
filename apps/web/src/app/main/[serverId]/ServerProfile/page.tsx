import { ServerProfilePage } from '@meezy/ui';
import { projectSidebarList, userList } from '../../context/list';

export default function ServerProfile() {
  return (
    <ServerProfilePage
      userList={userList}
      projectSidebarList={projectSidebarList}
    />
  );
}
