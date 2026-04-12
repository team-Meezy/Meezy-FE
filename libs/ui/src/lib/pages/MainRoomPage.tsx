'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  getIndividualEngagement,
  useMeetingStore,
} from '@org/shop-data';
import { useProfile, useServerState } from '../../context';
import { colors } from '../../design';
import { DashboardCard } from '../components/DashboardCard';
import { ParticipationChart } from '../components/ParticipationChart';

export function MainRoomPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();
  const { meetingId, teamId, lastEndedMeetingId, lastEndedTeamId } =
    useMeetingStore();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const [participationRate, setParticipationRate] = useState<number | null>(
    null
  );

  const persistedLastEndedMeeting = useMemo(() => {
    if (typeof window === 'undefined') {
      return { meetingId: '', teamId: '' };
    }

    try {
      const rawValue = sessionStorage.getItem('meezy:last-ended-meeting');
      if (!rawValue) {
        return { meetingId: '', teamId: '' };
      }

      const parsed = JSON.parse(rawValue) as {
        meetingId?: string;
        teamId?: string;
      };

      return {
        meetingId: String(parsed?.meetingId ?? '').trim(),
        teamId: String(parsed?.teamId ?? '').trim(),
      };
    } catch {
      return { meetingId: '', teamId: '' };
    }
  }, [lastEndedMeetingId, lastEndedTeamId]);

  const resolvedLastEndedMeetingId =
    lastEndedMeetingId || persistedLastEndedMeeting.meetingId;
  const resolvedLastEndedTeamId =
    lastEndedTeamId || persistedLastEndedMeeting.teamId;

  const displayName =
    profile?.nickname || profile?.name || profile?.username || '사용자';
  const ratePercent =
    participationRate != null ? Math.round(participationRate * 100) : 0;

  useEffect(() => {
    if (!serverId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const resolveMeetingId = async () => {
      const activeMeetingId =
        teamId === serverId ? String(meetingId ?? '').trim() : '';

      if (activeMeetingId) {
        return activeMeetingId;
      }

      try {
        const activeMeeting = await getActiveMeetings(serverId);
        const fetchedActiveMeetingId = String(activeMeeting?.meetingId ?? '').trim();

        if (fetchedActiveMeetingId) {
          return fetchedActiveMeetingId;
        }
      } catch {
        // Fall back to last ended meeting id.
      }

      if (resolvedLastEndedTeamId === serverId && resolvedLastEndedMeetingId) {
        return resolvedLastEndedMeetingId;
      }

      return '';
    };

    const fetchParticipation = async () => {
      const targetMeetingId = await resolveMeetingId();

      if (!targetMeetingId) {
        return false;
      }

      try {
        const individualEngagement = await getIndividualEngagement(
          serverId,
          targetMeetingId
        );

        if (cancelled) {
          return true;
        }

        setParticipationRate(individualEngagement?.currentRate ?? 0);
        return true;
      } catch {
        return false;
      }
    };

    const pollParticipation = async () => {
      if (cancelled || attempts >= maxAttempts) return;
      attempts += 1;

      const resolved = await fetchParticipation();
      if (!resolved && !cancelled) {
        window.setTimeout(() => {
          void pollParticipation();
        }, 3000);
      }
    };

    void pollParticipation();

    return () => {
      cancelled = true;
    };
  }, [
    meetingId,
    resolvedLastEndedMeetingId,
    resolvedLastEndedTeamId,
    serverId,
    teamId,
  ]);

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
              {displayName}님의 최근 회의 참여율은
            </span>
            <span className="mt-1 block break-keep lg:whitespace-nowrap">
              전체 대비 <span className="text-[#ff5c00]">{ratePercent}%</span>
              입니다
            </span>
          </h1>
          <p className="mx-auto max-w-[38rem] break-keep text-[clamp(0.8rem,0.95vw,0.96rem)] leading-[1.7] text-[#8d93a7] lg:mx-0">
            참여율은 회의별 개인 참여도 API 기준으로 반영됩니다.
            <br />
            현재 사용자의 최신 회의 참여도를 기준으로 표시합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
        <DashboardCard
          title="회의 피드백"
          description="Meezy의 AI 어시스턴트 리시버가 회의를 정리해 피드백에서 회의의 개선점을 바로 확인할 수 있게 보여줍니다."
          buttonText="회의 피드백 보러가기"
          onClick={() => serverId && router.push(`/main/${serverId}/feedback`)}
        />

        <DashboardCard
          title="회의 요약"
          description="Meezy의 AI 어시스턴트 리시버가 회의를 정리해 요약에서 회의를 보다 잘 관리할 수 있게 도와줍니다."
          buttonText="회의 요약 보러가기"
          onClick={() => serverId && router.push(`/main/${serverId}/summary`)}
        />
      </section>
    </main>
  );
}
