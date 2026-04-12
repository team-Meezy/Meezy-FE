'use client';

import { colors, typography } from '../../design';
import Image from 'next/image';
import { ChevronRight, Gear, JoinedPlus, Shrap } from '../../assets/index.client';
import { useState, useEffect } from 'react';
import { JoinedModal } from '../modals';
import { useRouter } from 'next/navigation';
import { useServerIdStore, useTeamStore } from '@org/shop-data';
import { useServerState, useProfile } from '../../context';
import { expelTeamMember, leaveTeam } from '@org/shop-data';
import { useChatStore } from '@org/shop-data';

interface JoinedSidebarProps {
  setChatRoom: (chatRoom: boolean) => void;
  setSelectedRoomId: (roomId: number) => void;
  setServerProfile: (serverProfile: boolean) => void;
  className?: string;
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

function formatSidebarName(name?: string | null) {
  const trimmed = String(name ?? '').trim();
  const characters = Array.from(trimmed);

  if (characters.length > 4) {
    return `${characters.slice(0, 4).join('')}...`;
  }

  return trimmed;
}

export function JoinedSidebar({
  setChatRoom,
  sidebarList,
  className,
}: JoinedSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ROOM' | 'MEMBER' | null>(null);
  const router = useRouter();
  const { serverId } = useServerIdStore();
  const { teams } = useTeamStore();
  const {
    teamMembers,
    setTeamMembers,
    contextMenuUserId,
    setContextMenuUserId,
    updateChatRooms,
  } = useServerState();
  const { profile } = useProfile();
  const { chatRooms, unreadCounts } = useChatStore();
  const currentTeamName =
    teams.find((team) => team.teamId === serverId)?.teamName || '팀 설정';

  const onOpenModal = (type: 'ROOM' | 'MEMBER' | null) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const teamRoomMap = Array.isArray(sidebarList)
    ? sidebarList.map((team) => ({
        ...team,
        rooms:
          team.type === 'ROOM' ? (Array.isArray(chatRooms) ? chatRooms : []) : [],
        users:
          team.type === 'MEMBER'
            ? Array.isArray(teamMembers)
              ? teamMembers
              : []
            : [],
      }))
    : [];

  const onContextMenu = (e: React.MouseEvent, targetUserId: string) => {
    e.preventDefault();
    setContextMenuUserId(targetUserId);
  };

  const handleClickOutside = () => setContextMenuUserId(null);

  // 현재 로그인한 유저가 리더인지 확인
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

    if (profileId && memberUserId && String(profileId) === String(memberUserId))
      return true;
    if (
      m.name === profile?.name ||
      m.name === profile?.userName ||
      m.name === profile?.nickName
    )
      return true;
    return false;
  });

  const isLeader = myMemberInfo?.role === 'LEADER';

  useEffect(() => {
    if (!serverId) return;
    updateChatRooms(serverId);
  }, [serverId, updateChatRooms]);

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

  const onLeaveTeam = async () => {
    if (!serverId) return;
    if (!confirm('정말로 팀을 나가시겠습니까?')) return;
    try {
      await leaveTeam(serverId);
      alert('팀에서 나갔습니다.');
      router.push('/main');
    } catch (error) {
      console.error('팀 나가기 실패:', error);
      alert('팀 나가기에 실패했습니다.');
    }
  };

  const onClickServerProfile = () => {
    if (myMemberInfo?.role === 'LEADER') {
      router.push(`/main/${serverId}/ServerProfile`);
    } else {
      const myRole = myMemberInfo?.role || 'NONE';
      alert(`서버 관리 권한이 없습니다. (내 역할: ${myRole})`);
    }
  };

  const onClickChatRoom = (roomId: string) => {
    setChatRoom(true);
    router.push(`/main/${serverId}/${roomId}`);
  };

  return (
    <nav
      className={`hidden lg:flex w-[156px] h-screen flex-col items-center shrink-0 ${className || ''}`}
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <button
        type="button"
        className="mt-8 flex justify-center items-center gap-4"
        onClick={onClickServerProfile}
        aria-label="서버 프로필 열기"
      >
        <span
          className="max-w-[100px] text-[24px] font-semibold"
          style={{ color: colors.gray[300] }}
        >
          <span className="truncate">{currentTeamName}</span>
        </span>
        <Image src={ChevronRight} alt="ChevronRight" />
      </button>
      <div className="w-full h-[1px] bg-white/5 mt-5" />
      <div className="flex flex-col items-center flex-1 overflow-y-auto no-scrollbar w-full text-white">
        {Array.isArray(teamRoomMap) && teamRoomMap.map((team, index) => (
          <div key={`team-section-${team.team_id}-${index}`} className="w-full">
            <div className="mt-5 flex w-full items-center gap-3 px-4">
              <div
                className="flex h-9 w-full items-center overflow-hidden rounded-lg px-2 transition-colors"
                style={{ color: colors.gray[300], ...typography.body.LBodyB }}
              >
                {team.room_name}
              </div>
              {isLeader && (
                <button
                  onClick={() => onOpenModal(team.type)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Image src={JoinedPlus} alt="addRoom" className="w-5" />
                </button>
              )}
            </div>

            {Array.isArray(team.rooms) && team.rooms.map((room) => (
              <div
                key={`room-${room.chatRoomId}`}
                className="group mt-1 flex min-h-12 w-full items-center justify-start gap-3 rounded-xl px-5 transition-all hover:bg-white/5 cursor-pointer"
                onClick={() => onClickChatRoom(room.chatRoomId)}
              >
                <div className="flex w-6 shrink-0 items-center justify-center">
                  <Image src={Shrap} alt="shrap" className="w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                </div>
                <span className="block min-w-0 flex-1 truncate text-sm opacity-70 transition-opacity group-hover:opacity-100" style={{ ...typography.body.BodyB }}>
                  {room.name}
                </span>
                {(unreadCounts[room.chatRoomId] ?? 0) > 0 && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors.primary[500] }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}

            {Array.isArray(team.users) && team.users.map((user, userIdx) => {
              const currentUserId = user.teamMemberId || (user as any).user_id || userIdx;
              const currentUserName = user.name || (user as any).user_name || '사용자';
              return (
                <div key={`user-${currentUserId}`} className="w-full px-4 mt-1 flex flex-col gap-2">
                  <div
                    className="flex min-h-[52px] w-full items-center justify-start gap-3 overflow-hidden rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/5 cursor-default"
                    onContextMenu={(e) => onContextMenu(e, currentUserId as any)}
                  >
                    {user.profileImageUrl || user.profileImage || (user as any).user?.profileImage ? (
                      <img
                        src={user.profileImageUrl || user.profileImage || (user as any).user?.profileImage}
                        alt={currentUserName}
                        className="rounded-full w-6 h-6 shrink-0 object-cover border border-white/10"
                      />
                    ) : (
                      <div className="rounded-full w-6 h-6 shrink-0 bg-gray-700 border border-white/5" />
                    )}
                    <span className="block min-w-0 flex-1 truncate text-sm leading-[1.3] opacity-70 p-0.5" style={{ ...typography.body.BodyB }}>
                      {formatSidebarName(currentUserName)}
                    </span>
                  </div>
                  {contextMenuUserId === currentUserId && (
                    <div className="flex flex-col gap-1 p-2 rounded-xl bg-[#1e1e1e] border border-white/5 shadow-xl animate-in fade-in zoom-in duration-200">
                      {isLeader && String(profile?.id || profile?.userId) !== String(currentUserId) && (
                        <button onClick={onKickUser} className="text-xs text-red-500 hover:bg-red-500/10 py-2 rounded-lg transition-colors">내보내기</button>
                      )}
                      {String(profile?.id || profile?.userId) === String(currentUserId) && (
                        <button onClick={onLeaveTeam} className="text-xs text-gray-400 hover:bg-white/5 py-2 rounded-lg transition-colors">나가기</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <JoinedModal isOpen={isModalOpen} type={modalType} onClose={onCloseModal} />
    </nav>
  );
}
