'use client';

import { useState } from 'react';
import {
  JoinedSidebar,
  CalendarMockup,
  useServerState,
  Header,
} from '@meezy/ui';
import { roomsrcList, userList, sidebarList } from '../context/list';

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChatRoom, setServerProfile } = useServerState();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  return (
    <div className="flex flex-1 overflow-hidden">
      <JoinedSidebar
        setChatRoom={setChatRoom}
        setSelectedRoomId={setSelectedRoomId}
        setServerProfile={setServerProfile}
        sidebarList={sidebarList}
        roomsrcList={roomsrcList}
        userList={userList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {children}
          <aside className="max-w-[270px] bg-[#111111] border border-white/5 p-6">
            <CalendarMockup />
          </aside>
        </div>
      </div>
    </div>
  );
}
