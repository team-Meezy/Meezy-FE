import {
  roomsrcList,
  sidebarList,
  useServerJoinedTeam,
  useServerState,
} from '../../../context';
import { JoinedSidebar } from '../../sidebar';
import { CalendarMockup, Header } from '../../components';
import { ReceiveAiAssistant } from '../../components';
import { useEffect } from 'react';
import { useServerIdStore, useGetTeamMembers } from '@org/shop-data';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChatRoom, setServerProfile, setTeamMembers } = useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();
  const { serverId } = useServerIdStore();

  useEffect(() => {
    if (!serverId) return;

    const fetchMembers = async () => {
      try {
        // 서버 전환 시 이전 멤버 목록 즉시 초기화하여 '공유'되는 현상 방지
        setTeamMembers([]);

        const data = await useGetTeamMembers(serverId);
        setTeamMembers(data);
      } catch (error) {
        console.error('Failed to fetch members in layout:', error);
      }
    };

    fetchMembers();
  }, [serverId, setTeamMembers]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <JoinedSidebar
        setChatRoom={setChatRoom}
        setSelectedRoomId={setSelectedRoomId}
        setServerProfile={setServerProfile}
        sidebarList={sidebarList}
        roomsrcList={roomsrcList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {joined && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {children}
          {joined && (
            <aside className="max-w-[270px] bg-[#111111] border border-white/5 p-6 flex flex-col gap-10">
              <CalendarMockup />
              <ReceiveAiAssistant />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
