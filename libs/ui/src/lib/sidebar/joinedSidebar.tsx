'use client';

import { colors, typography } from '../../design';
import Image from 'next/image';
import ChevronRight from '../../assets/ChevronRight.svg';
import joinedPlus from '../../assets/joinedPlus.svg';
import shrap from '../../assets/shrap.svg';
import { useState, useEffect } from 'react';
import { JoinedModal } from '../models/joinedModel';
import { UserKickModal } from '../models/userKickModal';

interface JoinedSidebarProps {
  setChatRoom: (chatRoom: boolean) => void;
  setSelectedRoomId: (roomId: number) => void;
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
  userList: {
    user_id: number;
    team_id: number;
    user_name: string;
    create_at: null;
    img: null;
  }[];
}

export function JoinedSidebar({
  setChatRoom,
  setSelectedRoomId,
  sidebarList,
  roomsrcList,
  userList,
}: JoinedSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ROOM' | 'MEMBER' | null>(null);
  const [contextMenuUserId, setContextMenuUserId] = useState<number | null>(
    null
  );
  const [users, setUsers] = useState(userList);

  const onOpenModal = (type: 'ROOM' | 'MEMBER' | null) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const onClickChatRoom = (room_id: number) => {
    setSelectedRoomId(room_id);
    setChatRoom(true);
  };

  const teamRoomMap = sidebarList.map((team) => ({
    ...team,
    rooms: roomsrcList.filter((room) => room.team_id === team.team_id),
    users: users.filter((user) => user.team_id === team.team_id),
  }));

  const onContextMenu = (e: React.MouseEvent, userId: number) => {
    e.preventDefault();
    setContextMenuUserId(userId);
  };

  const handleClickOutside = () => setContextMenuUserId(null);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const onKickUser = () => {
    setUsers((prev) =>
      prev.filter((user) => user.user_id !== contextMenuUserId)
    );
    setContextMenuUserId(null);
  };

  return (
    <nav
      className="w-[120px] h-screen flex flex-col items-center"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div
        className="mt-12 flex justify-center items-center gap-4"
        style={{ ...typography.body.BodyB }}
      >
        <span
          style={{
            color: colors.gray[300],
          }}
        >
          MEEZY
        </span>
        <Image src={ChevronRight} alt="ChevronRight" className="w-5" />
      </div>
      <div className="w-full h-[1px] bg-white/5 mt-5" />
      <div className="flex flex-col items-center flex-1 overflow-y-auto no-scrollbar w-full">
        {teamRoomMap.map((team) => (
          <div key={team.team_id} className="w-full">
            {/* 팀 */}
            <div className="flex justify-center items-center gap-4 mt-5">
              <div
                className="min-w-14 min-h-6 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: colors.gray[300], ...typography.body.LBodyB }}
              >
                {team.room_name}
              </div>
              <button onClick={() => onOpenModal(team.type)}>
                <Image src={joinedPlus} alt="addRoom" className="w-5" />
              </button>
            </div>

            {/* 팀의 룸 */}
            {team.rooms.map((room) => (
              <div
                key={room.room_id}
                className="flex justify-center items-center gap-4"
              >
                <div
                  className="min-w-24 min-h-8 mt-3 flex gap-5 items-center justify-center rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ color: colors.gray[300], ...typography.body.BodyB }}
                  onClick={() => {
                    onClickChatRoom(room.room_id);
                  }}
                >
                  <Image src={shrap} alt="shrap" className="w-4" />
                  <span>{room.room_name}</span>
                </div>
              </div>
            ))}

            {/* 팀의 사용자 */}
            {team.users.map((user) => (
              <div
                key={user.user_id}
                className="flex flex-col justify-center items-center"
              >
                <div
                  className="min-w-24 min-h-8 mt-3 flex gap-5 items-center justify-center rounded-lg transition-colors"
                  style={{ color: colors.gray[300], ...typography.body.BodyB }}
                >
                  <div
                    className="rounded-full w-5 h-5"
                    style={{ backgroundColor: colors.white[100] }}
                  />

                  <span onContextMenu={(e) => onContextMenu(e, user.user_id)}>
                    {user.user_name}
                  </span>
                </div>
                {contextMenuUserId === user.user_id && (
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
            ))}
          </div>
        ))}
      </div>
      <JoinedModal
        isOpen={isModalOpen}
        type={modalType}
        onClose={onCloseModal}
      />
      <UserKickModal
        isOpen={isModalOpen}
        type={modalType}
        onClose={onCloseModal}
      />
    </nav>
  );
}
