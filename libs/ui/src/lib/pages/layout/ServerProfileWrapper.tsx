import { ServerProfilePage } from '../ServerProfilePage';
import { projectSidebarList } from '../../../context';

export function ServerProfileWrapper() {
  return <ServerProfilePage projectSidebarList={projectSidebarList} />;
}
