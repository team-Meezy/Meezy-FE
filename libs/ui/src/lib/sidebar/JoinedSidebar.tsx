'use client';

import { colors, typography } from '../../design';
import Image from 'next/image';
import { ChevronRight, JoinedPlus, Shrap } from '../../assets/index.client';
import { useState, useEffect } from 'react';
import { JoinedModal, UserKickModal } from '../modals';
import { useRouter } from 'next/navigation';
import { useServerIdStore } from '@org/shop-data';
import { useServerState, useProfile } from '../../context';
import { expelTeamMember } from '@org/shop-data';
import { getChatRooms } from '@org/shop-data';
import { useChatStore } from '@org/shop-data';

interface JoinedSidebarProps {
  setChatRoom: (chatRoom: boolean) => void;
  setSelectedRoomId: (roomId: number) => void;
  setServerProfile: (serverProfile: boolean) => void;
  sidebarList: {
    team_id: number;
    room_name: string;
    type: 'ROOM' | 'MEMBER' | null;
    create_at: null;
  }[];
  roomsrcList: {
    room_id: number;
    team_id: number;
    room_name: string;
    create_at: null;
  }[];
}

export function JoinedSidebar({
  setChatRoom,
  setSelectedRoomId,
  setServerProfile,
  sidebarList,
  roomsrcList,
}: JoinedSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ROOM' | 'MEMBER' | null>(null);
  const router = useRouter();
  const { serverId } = useServerIdStore();
  const {
    teamMembers,
    setTeamMembers,
    contextMenuUserId,
    setContextMenuUserId,
  } = useServerState();
  const { profile } = useProfile();
  const { chatRooms, setChatRooms } = useChatStore();

  const onOpenModal = (type: 'ROOM' | 'MEMBER' | null) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const teamRoomMap = sidebarList.map((team) => ({
    ...team,
    rooms: team.type === 'ROOM' ? chatRooms : [],
    users: team.type === 'MEMBER' ? teamMembers : [],
  }));

  const onContextMenu = (e: React.MouseEvent, contextMenuUserId: string) => {
    e.preventDefault();
    setContextMenuUserId(contextMenuUserId);
  };

  const handleClickOutside = () => setContextMenuUserId(null);

  useEffect(() => {
    if (!serverId) return;

    const apiChatRooms = async () => {
      const res = await getChatRooms(serverId);
      setChatRooms(res);
    };
    apiChatRooms();
  }, [serverId]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const onKickUser = async () => {
    if (!serverId || !contextMenuUserId) return;

    try {
      await expelTeamMember(serverId, contextMenuUserId);
      setTeamMembers((prev) =>
        prev.filter((user) => user.teamMemberId !== contextMenuUserId)
      );
      setContextMenuUserId(null);
      alert('멤버가 제외되었습니다.');
    } catch (error) {
      console.error('멤버 제외 실패:', error);
      alert('멤버 제외에 실패했습니다.');
    }
  };

  const onClickServerProfile = () => {
    const myMemberInfo = teamMembers?.find((m) => {
      const profileId =
        profile?.id ||
        profile?.userId ||
        (profile as any)?.user_id ||
        (profile as any)?.accountId;
      const memberUserId =
        (m as any).userId ||
        (m as any).user_id ||
        (m as any).user?.id ||
        (m as any).user?.userId ||
        m.teamMemberId;

      // 1. 유저 ID로 직접 비교
      if (profileId && memberUserId && profileId === memberUserId) return true;

      // 2. 이름으로 보조 비교 (ID가 불확실할 때)
      if (
        m.name === profile?.name ||
        m.name === profile?.userName ||
        m.name === profile?.nickName
      )
        return true;

      return false;
    });

    if (myMemberInfo?.role === 'LEADER') {
      router.push(`/main/${serverId}/ServerProfile`);
    } else {
      const myRole = myMemberInfo?.role || 'NONE';
      alert(`서버 관리 권한이 없습니다. (내 역할: ${myRole})`);
    }
  };

  const onClickChatRoom = (room_id: number) => {
    setSelectedRoomId(room_id);
    setChatRoom(true);
    router.push(`/main/${room_id}/chat`);
  };

  return (
    <nav
      className="w-[120px] h-screen flex flex-col items-center"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <button
        type="button"
        className="mt-12 flex justify-center items-center gap-4 bg-transparent border-0 p-0"
        style={{ ...typography.body.BodyB }}
        onClick={onClickServerProfile}
        aria-label="서버 프로필 열기"
      >
        <span
          style={{
            color: colors.gray[300],
          }}
        >
          MEEZY
        </span>
        <Image src={ChevronRight} alt="ChevronRight" className="w-5" />
      </button>
      <div className="w-full h-[1px] bg-white/5 mt-5" />
      <div className="flex flex-col items-center flex-1 overflow-y-auto no-scrollbar w-full">
        {teamRoomMap.map((team, index) => (
          <div key={`team-section-${team.team_id}-${index}`} className="w-full">
            {/* 팀 */}
            <div className="flex justify-center items-center gap-4 mt-5">
              <div
                className="min-w-14 min-h-6 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: colors.gray[300], ...typography.body.LBodyB }}
              >
                {team.room_name}
              </div>
              <button onClick={() => onOpenModal(team.type)}>
                <Image src={JoinedPlus} alt="addRoom" className="w-5" />
              </button>
            </div>

            {/* 팀의 룸 */}
            {team.rooms.map((room, roomIdx) => (
              <div
                key={`room-${room.room_id || roomIdx}`}
                className="flex justify-center items-center gap-4"
              >
                <div
                  className="w-full px-4 min-h-8 mt-3 flex gap-5 items-center justify-start rounded-lg transition-colors hover:bg-white/5 cursor-pointer overflow-hidden"
                  style={{ color: colors.gray[300], ...typography.body.BodyB }}
                  onClick={() => {
                    onClickChatRoom(room.room_id);
                  }}
                >
                  <Image src={Shrap} alt="shrap" className="w-4 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </div>
              </div>
            ))}

            {/* 팀의 사용자 */}
            {team.users.map((user, userIdx) => {
              const currentUserId =
                user.teamMemberId || (user as any).user_id || userIdx;
              const currentUserName =
                user.name || (user as any).user_name || '알 수 없는 사용자';

              return (
                <div
                  key={`user-${currentUserId}`}
                  className="flex flex-col justify-center items-center"
                >
                  <div
                    className="w-full px-4 min-h-8 mt-3 flex gap-3 items-center justify-start rounded-lg transition-colors overflow-hidden"
                    style={{
                      color: colors.gray[300],
                      ...typography.body.BodyB,
                    }}
                  >
                    <div
                      className="rounded-full w-5 h-5 shrink-0"
                      style={{ backgroundColor: colors.white[100] }}
                    />

                    <span
                      className="truncate"
                      onContextMenu={(e) =>
                        onContextMenu(e, currentUserId as any)
                      }
                    >
                      {currentUserName}
                    </span>
                  </div>
                  {contextMenuUserId === currentUserId && (
                    <div
                      className="mt-2 px-4 py-3 flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: colors.gray[800],
                        ...typography.label.labelB,
                      }}
                    >
                      <button onClick={onKickUser}>내보내기</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <JoinedModal
        isOpen={isModalOpen}
        type={modalType}
        onClose={onCloseModal}
      />
    </nav>
  );
}
