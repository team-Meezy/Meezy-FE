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
import { useServerIdStore } from '@org/shop-data';
import { useParams } from 'next/navigation';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    teamMembers,
    setChatRoom,
    setServerProfile,
    setTeamMembers,
    updateTeamMembers,
  } = useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();
  const { setServerId } = useServerIdStore();
  const params = useParams();
  const currentServerId = params.serverId as string;

  useEffect(() => {
    if (!currentServerId) return;

    // 전역 스토어도 동기화
    setServerId(currentServerId);

    const fetchMembers = async () => {
      setTeamMembers([]);
      await updateTeamMembers(currentServerId);
    };

    fetchMembers();
  }, [currentServerId, setServerId, setTeamMembers, updateTeamMembers]);

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
