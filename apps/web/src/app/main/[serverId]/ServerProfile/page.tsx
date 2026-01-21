import {
  ServerProfilePage,
  projectSidebarList,
  userList,
} from '@meezy/ui/client';

export default function ServerProfile() {
  return (
    <ServerProfilePage
      userList={userList}
      projectSidebarList={projectSidebarList}
    />
  );
}
