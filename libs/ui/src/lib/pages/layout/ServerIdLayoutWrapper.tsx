'use client';

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
import { useParams, useRouter } from 'next/navigation';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChatRoom, setServerProfile, setTeamMembers, updateTeamMembers } =
    useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();
  const { setServerId } = useServerIdStore();
  const params = useParams();
  const currentServerId = params.serverId as string;
  const router = useRouter();

  useEffect(() => {
    if (!currentServerId) return;

    // 전역 스토어도 동기화
    setServerId(currentServerId);

    const fetchMembers = async () => {
      try {
        setTeamMembers([]);
        await updateTeamMembers(currentServerId);
      } catch (error: any) {
        if (error.response?.status === 403 || error.status === 403) {
          alert('해당 팀에 대한 접근 권한이 없습니다. (강퇴 또는 권한 없음)');
          router.push('/main');
        }
      }
    };

    fetchMembers();
  }, [currentServerId, setServerId, setTeamMembers, updateTeamMembers, router]);

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
