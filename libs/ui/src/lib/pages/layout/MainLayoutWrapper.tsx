'use client';

import { Header, CalendarMockup, MiniMeetingOverlay } from '../../components';
import { TeamSidebar } from '../../sidebar';
import { ServerModal } from '../../modals';
import { useServerJoinedTeam } from '../../../context';
import { useEffect } from 'react';
import { useModalStore } from '@org/shop-data';
import { useLoadingStore } from '@org/shop-data';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { joined } = useServerJoinedTeam();
  const { isSidebarOpen, setIsSidebarOpen } = useModalStore();
  const { isModalOpen, setIsModalOpen } = useModalStore();
  const { setLoading } = useLoadingStore();

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden relative">
      {/* Mobile Sidebar Overlay (TeamSidebar focus) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative z-10 w-[80px] h-full bg-[#111111] animate-in slide-in-from-left duration-300 flex flex-col overflow-y-auto no-scrollbar">
            <TeamSidebar 
              className="!flex !h-auto" 
              onOpenModal={() => setIsModalOpen(true)} 
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <TeamSidebar onOpenModal={() => setIsModalOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!joined && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {children}
          {!joined && (
            <aside className="hidden xl:flex w-full max-w-[270px] items-start bg-[#111111] border border-white/5 p-6 shrink-0">
              <CalendarMockup />
            </aside>
          )}
        </div>
      </div>

      <ServerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <MiniMeetingOverlay />
    </div>
  );
}
