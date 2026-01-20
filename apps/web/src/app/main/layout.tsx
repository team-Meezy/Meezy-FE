'use client';

import { Sidebar, ServerModal } from '@meezy/ui';
import { useState } from 'react';
import { projectSidebarList } from './context/list';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      <Sidebar
        onOpenModal={() => setIsModalOpen(true)}
        projectSidebarList={projectSidebarList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

      <ServerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
