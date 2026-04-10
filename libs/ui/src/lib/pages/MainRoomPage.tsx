'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  getTotalEngagement,
  type ParticipantEngagementMetrics,
  useMeetingStore,
} from '@org/shop-data';
import { useProfile, useServerState } from '../../context';
import { colors } from '../../design';
import { DashboardCard } from '../components/DashboardCard';
import { ParticipationChart } from '../components/ParticipationChart';

function getMeetingUserId(entity: any) {
  return String(
    entity?.userId ||
      entity?.user_id ||
      entity?.accountId ||
      entity?.memberId ||
      entity?.teamMemberId ||
      entity?.user?.userId ||
      entity?.user?.user_id ||
      entity?.user?.accountId ||
      entity?.user?.memberId ||
      entity?.user?.teamMemberId ||
      entity?.user?.id ||
      entity?.id ||
      ''
  ).trim();
}

function getUserIdFromAccessToken() {
  if (typeof window === 'undefined') return '';

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return '';

    const payload = token.split('.')[1];
    if (!payload) return '';

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    return String(
      decoded?.userId ||
        decoded?.user_id ||
        decoded?.id ||
        decoded?.sub ||
        decoded?.accountId ||
        ''
    ).trim();
  } catch {
    return '';
  }
}

export function MainRoomPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();
  const { meetingId, teamId, lastEndedMeetingId, lastEndedTeamId } =
    useMeetingStore();
  const { profile, loading: profileLoading } = useProfile();
  const { teamMembers } = useServerState();
  const [participationRate, setParticipationRate] = useState<number | null>(
    null
  );

  const teamMemberList = useMemo(
    () => (Array.isArray(teamMembers) ? teamMembers : []),
    [teamMembers]
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
    profile?.nickname || profile?.name || profile?.username || '팀원';
  const ratePercent =
    participationRate != null ? Math.round(participationRate * 100) : 0;

  const normalizeName = useCallback((name?: string | null) => {
    return String(name ?? '')
      .trim()
      .toLowerCase();
  }, []);

  const profileIds = useMemo(
    () =>
      [
        profile?.userId,
        profile?.id,
        profile?.user_id,
        profile?.accountId,
        profile?.memberId,
        profile?.teamMemberId,
        getMeetingUserId(profile),
        getUserIdFromAccessToken(),
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean),
    [profile]
  );

  const myComparableNames = useMemo(() => {
    return [
      profile?.name,
      profile?.nickname,
      profile?.username,
      (profile as any)?.userName,
      (profile as any)?.nickName,
    ]
      .map(normalizeName)
      .filter(Boolean);
  }, [normalizeName, profile]);

  const myMemberInfo = useMemo(() => {
    return teamMemberList.find((member: any) => {
      const memberIds = [
        member?.userId,
        member?.user_id,
        member?.accountId,
        member?.memberId,
        member?.teamMemberId,
        member?.id,
        member?.user?.id,
        member?.user?.userId,
        member?.user?.user_id,
        member?.user?.accountId,
        member?.user?.memberId,
        member?.user?.teamMemberId,
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

      if (memberIds.some((value) => profileIds.includes(value))) {
        return true;
      }

      const memberNames = [
        member?.name,
        member?.nickname,
        member?.nickName,
        member?.user?.name,
        member?.user?.nickname,
        member?.user?.nickName,
      ]
        .map(normalizeName)
        .filter(Boolean);

      return memberNames.some((value) => myComparableNames.includes(value));
    });
  }, [myComparableNames, normalizeName, profileIds, teamMemberList]);

  const localIds = useMemo(() => {
    const member = myMemberInfo as any;

    return Array.from(
      new Set(
        [
          getMeetingUserId(member),
          getMeetingUserId(member?.user),
          getMeetingUserId(profile),
          getUserIdFromAccessToken(),
        ]
          .map((value) => String(value ?? '').trim())
          .filter(Boolean)
      )
    );
  }, [myMemberInfo, profile]);

  useEffect(() => {
    if (!serverId) return;

    let isCancelled = false;
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
        return true;
      }

      const totalEngagement = await getTotalEngagement(
        serverId,
        targetMeetingId
      );

      if (
        !('participants' in totalEngagement) ||
        !Array.isArray(totalEngagement.participants)
      ) {
        return false;
      }

      const myMetrics = totalEngagement.participants.find(
        (participant: ParticipantEngagementMetrics) =>
          localIds.includes(String(participant.userId ?? '').trim())
      );

      if (myMetrics) {
        setParticipationRate(myMetrics.participationRate ?? 0);
        return true;
      }

      if (totalEngagement.participants.length === 1) {
        setParticipationRate(
          totalEngagement.participants[0]?.participationRate ?? 0
        );
        return true;
      }

      if (profileLoading || localIds.length === 0) {
        return false;
      }

      setParticipationRate(0);
      return true;
    };

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
      } catch {
        if (!isCancelled) {
          window.setTimeout(() => {
            void pollParticipation();
          }, 3000);
        }
      }
    };

    void pollParticipation();

    return () => {
      isCancelled = true;
    };
  }, [
    localIds,
    meetingId,
    profileLoading,
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
              {displayName}님의 가장 최근 회의 참여율은
            </span>
            <span className="mt-1 block break-keep lg:whitespace-nowrap">
              전체 팀원 중 <span className="text-[#ff5c00]">{ratePercent}%</span>{' '}
              입니다!
            </span>
          </h1>
          <p className="mx-auto max-w-[38rem] break-keep text-[clamp(0.8rem,0.95vw,0.96rem)] leading-[1.7] text-[#8d93a7] lg:mx-0">
            참여율 기준은 회의 중 채팅과 말의 빈도 수, 회의 참여 시간을 기준으로
            <br />
            리시버가 체크하여 반영됩니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
        <DashboardCard
          title="회의 피드백"
          description="Meezy의 AI 도우미 리시버가 회의를 정리한 피드백에서 회의의 질을 더 높여 드려요."
          buttonText="회의 피드백 보러가기"
          onClick={() => serverId && router.push(`/main/${serverId}/feedback`)}
        />

        <DashboardCard
          title="회의 요약"
          description="Meezy의 AI 도우미 리시버가 회의를 정리한 요약에서 회의를 보다 더 관리하기 쉽게 도와줘요!"
          buttonText="회의 요약 보러가기"
          onClick={() => serverId && router.push(`/main/${serverId}/summary`)}
        />
      </section>
    </main>
  );
}
