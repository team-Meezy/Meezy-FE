'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMeetingStore, useServerIdStore } from '@org/shop-data';
import { useEffect, useState } from 'react';
import { useMeeting, useServerJoinedTeam } from '../../context';
import { colors, typography } from '../../design';
import NextImage from 'next/image';
import ReceiveAssistantIcon from '../../assets/Receive.png';

export const ReceiveAiAssistant = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { serverId } = useServerIdStore();
  const { meeting } = useServerJoinedTeam();
  const { isRecording, startRecording, stopRecording } = useMeeting();
  const { startTime, hasActiveMeeting } = useMeetingStore();

  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!(hasActiveMeeting || meeting) || !startTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateTimer = () => {
      let startValue = startTime;
      if (
        typeof startValue === 'string' &&
        !startValue.includes('T') &&
        startValue.includes(' ')
      ) {
        startValue = startValue.replace(' ', 'T');
      }

      const start = new Date(startValue).getTime();
      if (isNaN(start)) return;

      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
      ].join(':');

      setElapsedTime(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [hasActiveMeeting, meeting, startTime]);

  const isSummary = pathname?.includes('/summary');
  const isFeedback = pathname?.includes('/feedback');
  // 참여율(메인)은 서버 ID는 있고 요약/피드백이 아닐 때로 간주
  const isTeam =
    !!serverId &&
    !isSummary &&
    !isFeedback &&
    pathname?.includes(`/main/${serverId}`);

  const onClickSummary = () => {
    if (serverId) router.push(`/main/${serverId}/summary`);
  };

  const onClickFeedback = () => {
    if (serverId) router.push(`/main/${serverId}/feedback`);
  };

  const onClickTeam = () => {
    if (serverId) router.push(`/main/${serverId}`);
  };

  return (
    <div className="min-w-[200px] fixed bottom-5 right-5 flex flex-col items-end gap-2 z-30">
      {/* 1. AI 도우미 팝업 카드 */}
      <div className="relative bg-[#1e1e1e]/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/5 w-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-white/5 pr-4">
          <div className="w-full text-gray-400 text-xs font-medium pt-3 px-4 pb-2">
            AI 도우미 - 리시브
          </div>
          {(hasActiveMeeting || meeting) && (
            <div className="flex items-center gap-2 mt-1 shrink-0">
              <span className="text-white text-[10px] font-bold tabular-nums">
                {elapsedTime}
              </span>
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            </div>
          )}
        </div>

        {meeting ? (
          <div className="flex flex-col gap-3 text-center p-8 relative z-10 min-h-[120px] justify-center">
            <button
              onClick={() => (isRecording ? stopRecording() : startRecording())}
              className="text-white hover:text-[#ff5c00] transition-colors"
              style={{ ...typography.body.BodyB }}
            >
              {isRecording ? '회의 녹음 중지' : '회의 녹음 시작'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-center p-6 relative z-10">
            <button
              onClick={onClickSummary}
              className="text-white hover:text-[#ff5c00] transition-colors"
              style={{
                ...(isSummary ? typography.body.BodyB : typography.label.labelM),
                color: isSummary ? colors.white[100] : colors.gray[500],
              }}
            >
              요약 바로 보러 가기
            </button>
            <button
              onClick={onClickFeedback}
              className="text-white hover:text-[#ff5c00] transition-colors"
              style={{
                ...(isFeedback
                  ? typography.body.BodyB
                  : typography.label.labelM),
                color: isFeedback ? colors.white[100] : colors.gray[500],
              }}
            >
              피드백 바로 보러 가기
            </button>
            <button
              onClick={onClickTeam}
              className="text-white hover:text-[#ff5c00] transition-colors"
              style={{
                ...(isTeam ? typography.body.BodyB : typography.label.labelM),
                color: isTeam ? colors.white[100] : colors.gray[500],
              }}
            >
              참여율 바로 보러 가기
            </button>
          </div>
        )}

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-[#ff5c00]/20 blur-[30px] rounded-full pointer-events-none" />
      </div>

      {/* 2. 농구공 캐릭터 영역 */}
      <div className="relative group cursor-pointer mr-2 mt-2 flex flex-col items-center">
        <div className="relative">
        <div className="absolute inset-0 bg-[#ff5c00]/40 rounded-full transition-all" />

        {/* 실제 캐릭터 이미지 */}
        <NextImage
          src={ReceiveAssistantIcon}
          alt="ReceiveAssistantIcon"
          width={70}
          height={70}
          className="w-20 h-20 drop-shadow-[0_0_15px_rgba(255,92,0,0.5)] relative z-10 transition-transform group-hover:scale-110 active:scale-95"
        />
        <div className="absolute inset-0 bg-[#ff5c00]/40 rounded-full transition-all group-hover:blur-md" />
        </div>
      </div>
    </div>
  );
};
