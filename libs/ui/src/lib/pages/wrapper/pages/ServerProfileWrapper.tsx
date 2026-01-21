import { ServerProfilePage } from '../../ServerProfilePage';
import { projectSidebarList, userList } from '../../../../context';

export function ServerProfileWrapper() {
  return (
    <ServerProfilePage
      userList={userList}
      projectSidebarList={projectSidebarList}
    />
  );
}
