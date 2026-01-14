import { Header, Sidebar, CalendarMockup } from '@meezy/ui';

export default function LayoutPage() {
  return (
    // 전체 배경은 사이드바와 동일한 #0c0c0c
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white overflow-hidden bg-white">
      {/* [좌측] 사이드바 - 위아래로 쭉 뻗은 구조 */}
      <Sidebar />

      {/* [중앙+우측] 콘텐츠 영역 컨테이너 */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* [상단] 헤더 - 로고와 프로필 */}
        <Header />

        {/* [메인] 실제 내용이 들어가는 둥근 박스 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 중앙 빈 화면 박스 */}
          <main className="flex-[3] bg-[#111111] border border-white/5 flex flex-col items-center justify-center">
            {/* 여기에 '아직 참가한 팀이 없습니다' 
                섹션이 들어갑니다. 
             */}
            <div className="text-center">
              <div className="w-32 h-32 bg-[#2a2a2a] rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-2">
                아직 참가한 팀이 없습니다.
              </h2>
              <p className="text-gray-500 text-sm">
                왼쪽 플러스 버튼을 눌러 팀에 참여해보세요!
              </p>
            </div>
          </main>

          {/* 우측 캘린더 영역 */}
          <aside className="flex-1 max-w-[300px] bg-[#111111] border border-white/5 p-6">
            {/* 캘린더 내용 */}
            <CalendarMockup />
          </aside>
        </div>
      </div>
    </div>
  );
}
