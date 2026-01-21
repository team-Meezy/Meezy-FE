'use client';

import { Header, CalendarMockup } from '../../../components';
import { TeamSidebar } from '../../../sidebar';
import { ServerModal } from '../../../modals';
import {
  projectSidebarList,
  useServerJoinedTeam,
  useServerModal,
} from '../../../../context';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { joined } = useServerJoinedTeam();
  const { isModalOpen, setIsModalOpen } = useServerModal();

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      <TeamSidebar
        onOpenModal={() => setIsModalOpen(true)}
        projectSidebarList={projectSidebarList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!joined && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {children}
          {!joined && (
            <aside className="max-w-[270px] bg-[#111111] border border-white/5 p-6">
              <CalendarMockup />
            </aside>
          )}
        </div>
      </div>

      <ServerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
