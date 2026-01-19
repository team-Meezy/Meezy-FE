'use client';

import { useState } from 'react';
import {
  Header,
  Sidebar,
  CalendarMockup,
  ServerModal,
  JoinedSidebar,
  DashboardCard,
  ParticipationChart,
  ChatRoom,
  MainRoom,
  ServerProfilePage,
} from '@meezy/ui';
import { colors, typography } from '@meezy/ui';
import {
  roomsrcList,
  userList,
  sidebarList,
  projectSidebarList,
} from '../context/list';

export function TeamJoined() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(false);
  const [serverProfile, setServerProfile] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const roomNameFind =
    roomsrcList.find((room) => room.room_id === selectedRoomId)?.room_name ??
    null;

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      {/* [좌측] 사이드바 - 위아래로 쭉 뻗은 구조 */}
      <Sidebar
        onOpenModal={onOpenModal}
        projectSidebarList={projectSidebarList}
      />
      {!serverProfile && (
        <JoinedSidebar
          setServerProfile={setServerProfile}
          setChatRoom={setChatRoom}
          setSelectedRoomId={setSelectedRoomId}
          sidebarList={sidebarList}
          roomsrcList={roomsrcList}
          userList={userList}
        />
      )}

      {/* [중앙+우측] 콘텐츠 영역 컨테이너 */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* [상단] 헤더 - 로고와 프로필 */}
        <Header />

        {/* [메인] 실제 내용이 들어가는 둥근 박스 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 중앙 빈 화면 박스 */}
          {chatRoom ? (
            <ChatRoom roomId={selectedRoomId} roomName={roomNameFind} />
          ) : serverProfile ? (
            <ServerProfilePage
              sidebarList={sidebarList}
              roomsrcList={roomsrcList}
              userList={userList}
              projectSidebarList={projectSidebarList}
            />
          ) : (
            <MainRoom />
          )}

          {/* 우측 캘린더 영역 */}
          <aside className="flex-1 max-w-[270px] bg-[#111111] border border-white/5 p-6">
            {/* 캘린더 내용 */}
            <CalendarMockup />
          </aside>
        </div>
      </div>
      <ServerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
