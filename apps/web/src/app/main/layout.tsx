'use client';

import { Header, Sidebar, ServerModal, CalendarMockup } from '@meezy/ui';
import { useState } from 'react';
import { projectSidebarList } from './context/list';
import { useServerJoinedTeam } from '@meezy/ui';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { joined } = useServerJoinedTeam();

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      <Sidebar
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
