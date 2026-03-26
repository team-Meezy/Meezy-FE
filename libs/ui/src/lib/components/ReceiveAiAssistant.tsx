'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { useMeetingStore, useServerIdStore } from '@org/shop-data';
import { useMeeting, useServerJoinedTeam, useServerState, useProfile } from '../../context';
import { colors, typography } from '../../design';
import ReceiveAssistantIcon from '../../assets/Receive.png';

export const ReceiveAiAssistant = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { serverId } = useServerIdStore();
  const { meeting } = useServerJoinedTeam();
  const { isRecording, startRecording, stopRecording } = useMeeting();
  const { startTime, hasActiveMeeting } = useMeetingStore();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();

  const myMemberInfo = teamMembers?.find((member: any) => {
    const profileId =
      profile?.id ||
      profile?.userId ||
      profile?.user_id ||
      (profile as any)?.accountId;
    const memberUserId =
      member?.userId ||
      member?.user_id ||
      member?.user?.id ||
      member?.user?.userId ||
      member?.teamMemberId;

    if (profileId && memberUserId && String(profileId) === String(memberUserId)) {
      return true;
    }

    return (
      member?.name === profile?.name ||
      member?.name === (profile as any)?.userName ||
      member?.name === (profile as any)?.nickName
    );
  });

  const isLeader = myMemberInfo?.role === 'LEADER';
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
      if (Number.isNaN(start)) return;

      const now = Date.now();
      const diff = Math.max(0, now - start);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsedTime(
        [
          hours.toString().padStart(2, '0'),
          minutes.toString().padStart(2, '0'),
          seconds.toString().padStart(2, '0'),
        ].join(':')
      );
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [hasActiveMeeting, meeting, startTime]);

  const isSummary = pathname?.includes('/summary');
  const isFeedback = pathname?.includes('/feedback');
  const isTeam =
    !!serverId &&
    !isSummary &&
    !isFeedback &&
    pathname?.includes(`/main/${serverId}`);

  return (
    <div className="fixed bottom-5 right-5 z-30 flex min-w-[200px] flex-col items-end gap-2">
      <div className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-[#1e1e1e]/90 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 pr-4">
          <div className="w-full px-4 pb-2 pt-3 text-xs font-medium text-gray-400">
            AI 도우미 - 리시브
          </div>
          {(hasActiveMeeting || meeting) && (
            <div className="mt-1 flex shrink-0 items-center gap-2">
              <span className="text-[10px] font-bold tabular-nums text-white">
                {elapsedTime}
              </span>
              {isRecording && (
                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {meeting ? (
          <div className="relative z-10 flex min-h-[120px] flex-col justify-center gap-3 p-8 text-center">
            {isLeader ? (
              <button
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                className={`transition-colors ${
                  isRecording
                    ? 'text-red-500 hover:text-red-400'
                    : 'text-white hover:text-[#ff5c00]'
                }`}
                style={{ ...typography.body.BodyB }}
              >
                {isRecording ? '회의 녹음 중지' : '회의 녹음 시작'}
              </button>
            ) : isRecording ? (
              <div className="flex justify-center">
                <div
                  className="rounded-full bg-red-600 px-4 py-2 text-white"
                  style={{ ...typography.body.BodyB }}
                >
                  회의 녹음 중
                </div>
              </div>
            ) : (
              <div className="text-white/60" style={{ ...typography.body.BodyM }}>
                리더가 녹음을 시작하면 여기에서 상태가 보입니다
              </div>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-3 p-6 text-center">
            <button
              onClick={() => serverId && router.push(`/main/${serverId}/summary`)}
              className="text-white transition-colors hover:text-[#ff5c00]"
              style={{
                ...(isSummary ? typography.body.BodyB : typography.label.labelM),
                color: isSummary ? colors.white[100] : colors.gray[500],
              }}
            >
              요약 바로 보러 가기
            </button>
            <button
              onClick={() => serverId && router.push(`/main/${serverId}/feedback`)}
              className="text-white transition-colors hover:text-[#ff5c00]"
              style={{
                ...(isFeedback ? typography.body.BodyB : typography.label.labelM),
                color: isFeedback ? colors.white[100] : colors.gray[500],
              }}
            >
              피드백 바로 보러 가기
            </button>
            <button
              onClick={() => serverId && router.push(`/main/${serverId}`)}
              className="text-white transition-colors hover:text-[#ff5c00]"
              style={{
                ...(isTeam ? typography.body.BodyB : typography.label.labelM),
                color: isTeam ? colors.white[100] : colors.gray[500],
              }}
            >
              참여 팀 바로 보러 가기
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-[#ff5c00]/20 blur-[30px]" />
      </div>

      <div className="relative mr-2 mt-2 flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#ff5c00]/40 transition-all" />
          <NextImage
            src={ReceiveAssistantIcon}
            alt="ReceiveAssistantIcon"
            width={70}
            height={70}
            className="relative z-10 h-20 w-20 drop-shadow-[0_0_15px_rgba(255,92,0,0.5)] transition-transform group-hover:scale-110 active:scale-95"
          />
          <div className="absolute inset-0 rounded-full bg-[#ff5c00]/40 transition-all group-hover:blur-md" />
        </div>
      </div>
    </div>
  );
};
