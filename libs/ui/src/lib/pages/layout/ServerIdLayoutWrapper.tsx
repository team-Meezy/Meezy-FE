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

function normalizeTeamMember(eventMember: any) {
  if (!eventMember) return null;

  const teamMemberId = String(
    eventMember?.teamMemberId ||
      eventMember?.memberId ||
      eventMember?.joinedUserId ||
      eventMember?.userId ||
      eventMember?.user_id ||
      eventMember?.accountId ||
      eventMember?.id ||
      eventMember?.user?.teamMemberId ||
      eventMember?.user?.memberId ||
      eventMember?.user?.userId ||
      eventMember?.user?.user_id ||
      eventMember?.user?.accountId ||
      eventMember?.user?.id ||
      ''
  ).trim();

  const name = String(
    eventMember?.name ||
      eventMember?.joinedUserName ||
      eventMember?.nickname ||
      eventMember?.nickName ||
      eventMember?.userName ||
      eventMember?.user?.name ||
      eventMember?.user?.nickname ||
      eventMember?.user?.nickName ||
      ''
  ).trim();

  if (!teamMemberId && !name) {
    return null;
  }

  return {
    ...eventMember,
    teamMemberId,
    name: name || '참가자',
    role: eventMember?.role || eventMember?.user?.role || 'MEMBER',
    profileImage:
      eventMember?.profileImage || eventMember?.user?.profileImage || undefined,
    profileImageUrl:
      eventMember?.profileImageUrl ||
      eventMember?.joinedUserProfileImageUrl ||
      eventMember?.user?.profileImageUrl ||
      undefined,
  };
}

function extractTeamMembersFromEvent(event: any) {
  const eventMembers = [
    event?.member,
    event?.teamMember,
    event?.user,
    event?.joinedMember,
    event?.joinedUser,
    event?.payload?.member,
    event?.payload?.teamMember,
    event?.payload?.user,
    event?.data?.member,
    event?.data?.teamMember,
    event?.data?.user,
    event?.joinedUserId || event?.joinedUserName
      ? {
          joinedUserId: event?.joinedUserId,
          joinedUserName: event?.joinedUserName,
          joinedUserProfileImageUrl: event?.joinedUserProfileImageUrl,
        }
      : null,
  ];

  const eventMemberLists = [
    event?.members,
    event?.teamMembers,
    event?.payload?.members,
    event?.payload?.teamMembers,
    event?.data?.members,
    event?.data?.teamMembers,
  ];

  const normalizedMembers = [
    ...eventMembers,
    ...eventMemberLists.flatMap((members) =>
      Array.isArray(members) ? members : []
    ),
  ]
    .map((member) => normalizeTeamMember(member))
    .filter(Boolean);

  return Array.from(
    new Map(
      normalizedMembers.map((member: any) => [
        member.teamMemberId || member.name,
        member,
      ])
    ).values()
  );
}

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
      const eventMembers = extractTeamMembersFromEvent(event);

      if (eventMembers.length > 0) {
        setTeamMembers((prev) => {
          const mergedMembers = new Map(
            prev.map((member: any) => [
              String(member?.teamMemberId || member?.name || ''),
              member,
            ])
          );

          eventMembers.forEach((member: any) => {
            const memberKey = String(member?.teamMemberId || member?.name || '');
            const previous = mergedMembers.get(memberKey);
            mergedMembers.set(memberKey, previous ? { ...previous, ...member } : member);
          });

          return Array.from(mergedMembers.values());
        });
      }

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
        void updateTeamMembers(currentServerId);
        void updateChatRooms(currentServerId);
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
        void updateChatRooms(currentServerId);
        void updateTeamMembers(currentServerId);
        window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));
      }
    },
    [currentServerId, setTeamMembers, updateChatRooms, updateTeamMembers]
  );

  useTeamSocket(currentServerId, handleTeamEvent);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile Drawer (JoinedSidebar focus) - Offset by TeamSidebar width */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed top-0 bottom-0 left-[80px] z-[100] w-[240px] bg-[#0c0c0c] animate-in slide-in-from-left duration-300">
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
