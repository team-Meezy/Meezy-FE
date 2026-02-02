'use client';

import Image from 'next/image';
import ReceiveAssistantIcon from '../../assets/Receive.png';
import { colors, typography } from '../../design';

export const ReceiveAiAssistant = () => {
  return (
    <div className="min-w-[200px] fixed bottom-5 right-5 flex flex-col items-end gap-2 z-30">
      {/* 1. AI 도우미 팝업 카드 */}
      <div className="relative bg-[#1e1e1e]/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/5 w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-white/5">
          <div className="w-full text-gray-400 text-xs font-medium pt-3 px-4 pb-2">
            AI 도우미 - 리시브
          </div>
        </div>

        <div className="flex flex-col gap-3 text-center p-6 relative z-10">
          <button
            className="text-white hover:text-[#ff5c00] transition-colors"
            style={{ ...typography.body.BodyB, color: colors.white[100] }}
          >
            요약 바로 보러 가기
          </button>
          <button
            className="text-white hover:text-[#ff5c00] transition-colors"
            style={{ ...typography.label.labelM, color: colors.gray[500] }}
          >
            피드백 바로 보러 가기
          </button>
          <button
            className="text-white hover:text-[#ff5c00] transition-colors"
            style={{ ...typography.label.labelM, color: colors.gray[500] }}
          >
            참여율 바로 보러 가기
          </button>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-[#ff5c00]/20 blur-[30px] rounded-full pointer-events-none" />
      </div>

      {/* 2. 농구공 캐릭터 영역 */}
      <div className="relative group cursor-pointer mr-2 mt-2">
        <div className="absolute inset-0 bg-[#ff5c00]/40 rounded-full transition-all" />

        {/* 실제 캐릭터 이미지 */}
        <Image
          src={ReceiveAssistantIcon}
          alt="ReceiveAssistantIcon"
          width={70}
          height={70}
          className="w-20 h-20 drop-shadow-[0_0_15px_rgba(255,92,0,0.5)] relative z-10 transition-transform group-hover:scale-110 active:scale-95"
        />
      </div>
    </div>
  );
};
