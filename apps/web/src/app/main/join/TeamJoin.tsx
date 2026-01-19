'use client';

import { useState } from 'react';
import { Header, Sidebar, CalendarMockup, ServerModal } from '@meezy/ui';
import Image from 'next/image';
import noTeamReceive from '../../../assets/noTeam_Receive.png'
import { colors } from '@meezy/ui'

export function TeamJoin() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden">
      {/* [좌측] 사이드바 - 위아래로 쭉 뻗은 구조 */}
      <Sidebar onOpenModal={onOpenModal} onCloseModal={onCloseModal} />

      {/* [중앙+우측] 콘텐츠 영역 컨테이너 */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* [상단] 헤더 - 로고와 프로필 */}
        <Header />

        {/* [메인] 실제 내용이 들어가는 둥근 박스 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 중앙 빈 화면 박스 */}
          <main
            className="flex-[3] border border-white/5 flex flex-col items-center justify-center"
            style={{ backgroundColor: colors.black[100] }}
          >
            {/* '아직 참가한 팀이 없습니다' 섹션 */}
            <div className="text-center flex flex-col gap-2">
              <div className="w-32 h-32 bg-[#2a2a2a] rounded-full mx-auto mb-6">
                <Image src={noTeamReceive} alt="no team receive" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                아직 참가한 팀이 없습니다.
              </h2>
              <p className="text-gray-500 text-sm">
                왼쪽 플러스 버튼을 눌러 팀에 참여하거나, 팀을 생성하여 다양한
                사람들과
                <br /> AI 기반 회의를 진행하고 요약 및 피드백을 해드려요!
              </p>
            </div>
          </main>

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
