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
import { useEffect, useCallback } from 'react';
import { useServerIdStore, useTeamSocket } from '@org/shop-data';
import { useParams, useRouter } from 'next/navigation';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    setChatRoom,
    setServerProfile,
    setTeamMembers,
    updateTeamMembers,
    updateChatRooms,
  } = useServerState();
  const { joined, setJoined, setSelectedRoomId } = useServerJoinedTeam();
  const { setServerId } = useServerIdStore();
  const params = useParams();
  const currentServerId = params.serverId as string;
  const router = useRouter();

  useEffect(() => {
    if (!currentServerId || currentServerId === 'undefined') {
      router.push('/main');
      return;
    }

    // 전역 스토어도 동기화
    setServerId(currentServerId);
    setJoined(true);

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

  const handleTeamEvent = useCallback(
    (event: any) => {
      if (
        event.type === 'CHAT_ROOM_UPDATE' ||
        event.category === 'CHAT_ROOM' ||
        event.type === 'CHAT_ROOM_CREATED' ||
        event.type === 'CHAT_ROOM_DELETED'
      ) {
        updateChatRooms(currentServerId);
      } else if (
        event.type === 'MEMBER_UPDATE' ||
        event.category === 'MEMBER' ||
        event.type === 'MEMBER_JOINED' ||
        event.type === 'MEMBER_LEFT'
      ) {
        updateTeamMembers(currentServerId);
      } else if (
        event.type === 'MEETING_STARTED' ||
        event.type === 'MEETING_ENDED' ||
        event.category === 'MEETING'
      ) {
        console.log('ServerIdLayoutWrapper: [EVENT] Meeting event received, triggering sync');
        window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));
      } else {
        // Fallback for any other team events
        updateChatRooms(currentServerId);
        updateTeamMembers(currentServerId);
        window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));
      }
    },
    [currentServerId, updateChatRooms, updateTeamMembers]
  );

  useTeamSocket(currentServerId, handleTeamEvent);

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
