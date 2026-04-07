'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTeamDetail,
  getTotalEngagement,
  type ParticipantEngagementMetrics,
  useMeetingStore,
  useServerIdStore,
} from '@org/shop-data';
import { useProfile } from '../../context';
import { colors } from '../../design';
import { DashboardCard } from '../components/DashboardCard';
import { ParticipationChart } from '../components/ParticipationChart';

export function MainRoomPage() {
  const { serverId } = useServerIdStore();
  const { lastEndedMeetingId, lastEndedTeamId } = useMeetingStore();
  const router = useRouter();
  const { profile } = useProfile();
  const [participationRate, setParticipationRate] = useState<number | null>(
    null
  );

  const displayName =
    profile?.nickname || profile?.name || profile?.username || '팀원';
  const ratePercent =
    participationRate != null ? Math.round(participationRate * 100) : 0;
  const summaryText = useMemo(() => {
    return `${displayName}님의 가장 최근 회의 참여율은 전체 팀원 중 ${ratePercent}%입니다!`;
  }, [displayName, ratePercent]);

  useEffect(() => {
    if (!serverId) return;

    const getDetail = async () => {
      try {
        const data = await getTeamDetail(serverId);
        console.log('getTeamDetail data', data);
      } catch (error) {
        console.error('Failed to get team detail:', error);
      }
    };

    void getDetail();
  }, [serverId]);

  useEffect(() => {
    if (!serverId) return;
    if (lastEndedTeamId !== serverId || !lastEndedMeetingId) return;

    const fetchParticipation = async () => {
      const totalEngagement = await getTotalEngagement(
        serverId,
        lastEndedMeetingId
      );

      if (!('participants' in totalEngagement)) {
        return false;
      }

      const profileIds = [
        profile?.userId,
        profile?.id,
        profile?.user_id,
        profile?.accountId,
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

      const myMetrics = totalEngagement.participants.find(
        (participant: ParticipantEngagementMetrics) =>
          profileIds.includes(String(participant.userId ?? '').trim())
      );

      setParticipationRate(myMetrics?.participationRate ?? 0);
      return true;
    };

    let isCancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const pollParticipation = async () => {
      if (isCancelled || attempts >= maxAttempts) return;
      attempts += 1;

      try {
        const resolved = await fetchParticipation();
        if (!resolved && !isCancelled) {
          window.setTimeout(() => {
            void pollParticipation();
          }, 3000);
        }
      } catch (error) {
        console.error('fetchParticipation error', error);
      }
    };

    void pollParticipation();

    return () => {
      isCancelled = true;
    };
  }, [lastEndedMeetingId, lastEndedTeamId, profile, serverId]);

  return (
    <main
      className="no-scrollbar flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:gap-5"
      style={{ backgroundColor: colors.black[100] }}
    >
      <section className="mx-auto grid w-full max-w-6xl flex-[1.1] grid-cols-1 items-center gap-5 rounded-[24px] border border-white/5 bg-[#1e1e1e] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-6 sm:py-6 lg:grid-cols-[minmax(170px,240px)_minmax(0,1.45fr)] lg:gap-8 lg:px-8 xl:rounded-[28px] xl:px-10 xl:py-8">
        <div className="flex items-center justify-center">
          <ParticipationChart
            size={172}
            percentage={ratePercent}
            labelClassName="text-[clamp(1.4rem,2vw,1.9rem)]"
          />
        </div>

        <div className="flex flex-col justify-center gap-4 text-center lg:text-left">
          <h1 className="text-[clamp(1.1rem,1.7vw,2rem)] font-bold leading-[1.22] tracking-[-0.04em] text-white">
            <span className="block break-keep lg:whitespace-nowrap">
              {displayName}님의 가장 최근 <span className="text-[#ff5c00]">회의 참여율</span>은
            </span>
            <span className="mt-1 block break-keep lg:whitespace-nowrap">
              전체 팀원 중 <span className="text-[#ff5c00]">{ratePercent}%</span> 입니다!
            </span>
          </h1>
          <p className="mx-auto max-w-[38rem] break-keep text-[clamp(0.8rem,0.95vw,0.96rem)] leading-[1.7] text-[#8d93a7] lg:mx-0">
            참여율 기준은 회의 중 말의 빈도수가 얼마나 많았는지 리시브가
            체크하여 반영됩니다.
          </p>
          <p className="text-[clamp(0.65rem,1vw,0.75rem)] font-medium uppercase tracking-[0.24em] text-white/20 lg:hidden">
            {summaryText}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
        <DashboardCard
          title="회의 피드백"
          description="Meezy.의 AI 도우미 '리시브'가 회의를 정리해 피드백 해서 회의의 질을 높여 드려요!"
          buttonText="회의 피드백 보기"
          onClick={() => serverId && router.push(`/main/${serverId}/feedback`)}
        />

        <DashboardCard
          title="회의 요약"
          description="Meezy.의 AI 도우미 '리시브'가 회의를 정리해 요약해서 회의를 보다 더 관리하기 쉽게 도와줘요!"
          buttonText="회의 요약 보기"
          onClick={() => serverId && router.push(`/main/${serverId}/summary`)}
        />
      </section>
    </main>
  );
}
