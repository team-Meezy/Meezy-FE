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
import { useServerIdStore, useTeamSocket, useModalStore } from '@org/shop-data';
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
  const { isSidebarOpen, setIsSidebarOpen } = useModalStore();
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
      const eventType = String(event?.type || '').toUpperCase();
      const eventCategory = String(event?.category || '').toUpperCase();

      if (
        eventType === 'CHAT_ROOM_UPDATE' ||
        eventType === 'CHAT_ROOM_CREATED' ||
        eventType === 'CHAT_ROOM_DELETED' ||
        eventCategory === 'CHAT_ROOM'
      ) {
        updateChatRooms(currentServerId);
      } else if (
        eventType === 'MEMBER_UPDATE' ||
        eventType === 'MEMBER_JOINED' ||
        eventType === 'MEMBER_LEFT' ||
        eventType === 'PARTICIPANT_JOINED' ||
        eventType === 'PARTICIPANT_LEFT' ||
        eventCategory === 'MEMBER'
      ) {
        updateTeamMembers(currentServerId);
        updateChatRooms(currentServerId);
      } else if (
        eventType === 'MEETING_STARTED' ||
        eventType === 'MEETING_ENDED' ||
        eventCategory === 'MEETING'
      ) {
        console.log(
          'ServerIdLayoutWrapper: [EVENT] Meeting event received, triggering sync'
        );
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
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile Drawer (JoinedSidebar focus) - Offset by TeamSidebar width */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed top-0 bottom-0 left-[80px] z-[100] w-[200px] bg-[#0c0c0c] animate-in slide-in-from-left duration-300">
          <JoinedSidebar
            className="!flex !w-full"
            setChatRoom={setChatRoom}
            setSelectedRoomId={setSelectedRoomId}
            setServerProfile={setServerProfile}
            sidebarList={sidebarList}
            roomsrcList={roomsrcList}
          />
        </div>
      )}

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
            <aside className="hidden xl:flex w-full max-w-[270px] bg-[#111111] border border-white/5 p-6 flex flex-col gap-10 shrink-0">
              <CalendarMockup />
              <ReceiveAiAssistant />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
