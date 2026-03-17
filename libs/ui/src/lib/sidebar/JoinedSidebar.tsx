'use client';

import { colors, typography } from '../../design';
import Image from 'next/image';
import { ChevronRight, JoinedPlus, Shrap } from '../../assets/index.client';
import { useState, useEffect } from 'react';
import { JoinedModal, UserKickModal } from '../modals';
import { useRouter } from 'next/navigation';
import { useServerIdStore } from '@org/shop-data';
import { useServerState, useProfile } from '../../context';
import { expelTeamMember, leaveTeam } from '@org/shop-data';
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
  sidebarList,
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
  console.log(teamRoomMap, 'safdghsaz');

  const onContextMenu = (e: React.MouseEvent, contextMenuUserId: string) => {
    e.preventDefault();
    setContextMenuUserId(contextMenuUserId);
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

    const apiChatRooms = async () => {
      const res = await getChatRooms(serverId);
      console.log('chatRooms', chatRooms);
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
    // roomId가 바로 API에서 받아온 그 chatRoomId입니다.
    router.push(`/main/${serverId}/${roomId}`);
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
        {Array.isArray(teamRoomMap) && teamRoomMap.map((team, index) => (
          <div key={`team-section-${team.team_id}-${index}`} className="w-full">
            {/* 팀 */}
            <div className="flex justify-center items-center gap-4 mt-5">
              <div
                className="min-w-14 min-h-6 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: colors.gray[300], ...typography.body.LBodyB }}
              >
                {team.room_name}
              </div>
              {isLeader ? (
                <button
                  onClick={() => {
                    onOpenModal(team.type);
                  }}
                >
                  <Image src={JoinedPlus} alt="addRoom" className="w-5" />
                </button>
              ) : (
                <div className="w-5 invisible" />
              )}
            </div>

            {/* 팀의 룸 */}
            {Array.isArray(team.rooms) && team.rooms.map((room) => (
              <div
                key={`room-${room.chatRoomId}`}
                className="flex justify-center items-center gap-4"
              >
                <div
                  className="w-full px-4 min-h-8 mt-3 flex gap-5 items-center justify-start rounded-lg transition-colors hover:bg-white/5 cursor-pointer overflow-hidden"
                  style={{ color: colors.gray[300], ...typography.body.BodyB }}
                  onClick={() => {
                    onClickChatRoom(room.chatRoomId);
                  }}
                >
                  <Image src={Shrap} alt="shrap" className="w-4 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </div>
              </div>
            ))}

            {/* 팀의 사용자 */}
            {Array.isArray(team.users) && team.users.map((user, userIdx) => {
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
                    {user.profileImageUrl || user.profileImage || (user as any).user?.profileImage ? (
                      <img
                        src={user.profileImageUrl || user.profileImage || (user as any).user?.profileImage}
                        alt={currentUserName}
                        className="rounded-full w-5 h-5 shrink-0 object-cover"
                      />
                    ) : (
                      <div
                        className="rounded-full w-5 h-5 shrink-0"
                        style={{ backgroundColor: colors.white[100] }}
                      />
                    )}

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
                      className="mt-2 px-4 py-3 flex flex-col items-center justify-center rounded-lg transition-colors gap-2"
                      style={{
                        backgroundColor: colors.gray[800],
                        ...typography.label.labelB,
                      }}
                    >
                      {isLeader && String(profile?.id || profile?.userId) !== String(currentUserId) && (
                        <button onClick={onKickUser} className="text-red-500 hover:text-red-400 transition-colors">내보내기</button>
                      )}
                      {String(profile?.id || profile?.userId) === String(currentUserId) && (
                        <button onClick={onLeaveTeam} className="text-gray-300 hover:text-white transition-colors">나가기</button>
                      )}
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
