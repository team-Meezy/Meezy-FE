'use client';

import { Header, CalendarMockup } from '../../components';
import { TeamSidebar } from '../../sidebar';
import { ServerModal } from '../../modals';
import { useServerJoinedTeam } from '../../../context';
import { useEffect } from 'react';
import { useModalStore } from '@org/shop-data';
import { useLoadingStore } from '@org/shop-data';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { joined } = useServerJoinedTeam();
  const { isModalOpen, setIsModalOpen } = useModalStore();
  const { setLoading } = useLoadingStore();

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      <TeamSidebar onOpenModal={() => setIsModalOpen(true)} />

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
