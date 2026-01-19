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
} from '@meezy/ui';
import { colors, typography } from '@meezy/ui';

export function TeamJoined() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

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
      <JoinedSidebar
        chatRoom={chatRoom}
        setChatRoom={setChatRoom}
        setSelectedRoomId={setSelectedRoomId}
      />

      {/* [중앙+우측] 콘텐츠 영역 컨테이너 */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* [상단] 헤더 - 로고와 프로필 */}
        <Header />

        {/* [메인] 실제 내용이 들어가는 둥근 박스 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 중앙 빈 화면 박스 */}
          {chatRoom ? (
            <ChatRoom roomId={selectedRoomId} />
          ) : (
            <main
              className="flex-[3] border border-white/5 flex flex-col items-center justify-center p-10 gap-3"
              style={{ backgroundColor: colors.black[100] }}
            >
              {/* 회의 참여율 섹션 */}
              <section className="w-full bg-[#1e1e1e] rounded-3xl p-12 flex items-center justify-around">
                <ParticipationChart
                  size={Math.min(window.innerWidth * 0.1, 240)}
                  percentage={87.5}
                />
                <div className="flex flex-col gap-3 p-10">
                  <h1
                    className="text-white leading-snug"
                    style={{
                      ...typography.title.TitleB,
                    }}
                  >
                    손희찬님의 가장 최근{' '}
                    <span className="text-[#ff5c00]">회의 참여율</span>은<br />
                    전체 팀원 중 <span className="text-[#ff5c00]">
                      87.5%
                    </span>{' '}
                    입니다!
                  </h1>
                  <p className="text-gray-500 text-sm">
                    참여율 기준은 회의 중 말의 빈도수가 얼마나
                    <br /> 많았는지 리시브가 체크하여 반영됩니다.
                  </p>
                </div>
              </section>
              {/* 회의 피드백 섹션 */}
              <div className="w-full grid grid-cols-2 gap-5">
                <DashboardCard
                  title="회의 피드백"
                  description="Meezy의 AI 도우미인 '리시브'가 회의를 정리해 피드백 해서 회의의 질을 높여 드려요!"
                  buttonText="회의 피드백 보기"
                />
                <DashboardCard
                  title="회의 요약"
                  description="Meezy의 AI 도우미인 '리시브'가 회의를 정리해 요약해서 회의를 보다 더 관리하기 쉽게 도와줘요!"
                  buttonText="회의 요약 보기"
                />
              </div>
            </main>
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

// <div>
//         <div>
//           {messages.map((msg, i) => (
//             <div key={i}>{msg}</div>
//           ))}
//         </div>

//         <input value={input} onChange={(e) => setInput(e.target.value)} />
//         <button onClick={sendMessage}>전송</button>
//       </div>
