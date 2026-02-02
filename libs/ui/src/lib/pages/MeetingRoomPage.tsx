'use client';

const VideoCard = ({
  name,
  isSpeaking,
  gridArea,
}: {
  name: string;
  isSpeaking?: boolean;
  gridArea?: string;
}) => {
  return (
    <div
      style={{ gridArea }}
      className={`
      relative bg-[#1e1e1e] rounded-2xl flex flex-col items-center justify-center overflow-hidden
      w-full h-full min-h-0 transition-all 
    `} // aspect-video를 빼고 h-full, min-h-0를 주어 그리드 크기에 맞춤
    >
      <div
        className={`
        w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#d9d9d9] transition-all
        ${isSpeaking ? 'ring-4 ring-[#4ade80]   ' : 'ring-0'}
      `}
      />
      <span className="mt-4 text-white font-bold text-base md:text-lg">
        {name}
      </span>
      <div className="absolute bottom-4 left-4 flex gap-2 items-center">
        <span className="text-gray-500 text-sm">🎙️</span>
        <span className="text-[#ff5c00] text-sm font-bold">🚫</span>
      </div>
    </div>
  );
};

export const MeetingRoomPage = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] p-4 md:py-6 md:px-12 overflow-hidden">
      {/* 🟢 핵심: 그리드 비율 조정 */}
      <div
        className="flex-1 grid gap-4 max-w-5xl mx-auto w-full min-h-0"
        style={{
          // 첫 번째 행(메인)은 1.5배, 두 번째 행(서브)은 1배 비율로 높이 배정
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1.5fr 1fr',
          gridTemplateAreas: `
            "main main"
            "sub1 sub2"
          `,
        }}
      >
        <VideoCard name="손희찬" gridArea="main" />
        <VideoCard name="김효현" isSpeaking gridArea="sub1" />
        <VideoCard name="김효현" isSpeaking gridArea="sub2" />
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="mt-4 bg-[#1e1e1e] rounded-2xl p-2 flex items-center justify-center gap-6 relative w-full max-w-5xl mx-auto shrink-0">
        <button className="p-2 md:p-3 hover:bg-[#333] rounded-full transition-colors">
          <span className="text-gray-400 text-xl">🎙️</span>
        </button>
        <button className="p-2 md:p-3 hover:bg-[#e65300] rounded-full transition-colors">
          <span className="text-white text-xl">🚫</span>
        </button>
        <button className="absolute right-8 text-gray-500 hover:text-white">
          <span className="text-2xl">⛶</span>
        </button>
      </div>
    </div>
  );
};
