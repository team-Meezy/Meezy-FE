'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../../design';
import { ParticipationChart } from '../components/ParticipationChart';
import { DashboardCard } from '../components/DashboardCard';
import { useRouter } from 'next/navigation';
import {
  getTeamDetail,
  getTotalEngagement,
  getIndividualEngagement,
} from '@org/shop-data';
import { useServerState, useProfile } from '../../context';
import { useServerIdStore } from '@org/shop-data';

export function MainRoomPage() {
  const [chartSize, setChartSize] = useState(192);
  const { serverId } = useServerIdStore();
  const router = useRouter();
  const { setTeamMembers } = useServerState();
  const { profile } = useProfile();
  const [participationRate, setParticipationRate] = useState<number | null>(
    null
  );

  const displayName =
    profile?.nickname || profile?.name || profile?.username || '회원';
  const ratePercent =
    participationRate != null ? Math.round(participationRate * 100) : null;

  useEffect(() => {
    const calc = () => setChartSize(Math.min(window.innerWidth * 0.1, 240));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

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

    getDetail();
  }, [serverId]);

  // 개인 회의 참여율 데이터 가져오기
  useEffect(() => {
    if (!serverId) return;

    const fetchParticipation = async () => {
      try {
        // 1) totalEngagement에서 meetingId 가져오기
        const totalEngagement = await getTotalEngagement(serverId, serverId);
        console.log(totalEngagement, 'totalEngagement');
        const fetchedMeetingId = totalEngagement?.meetingId;

        if (!fetchedMeetingId) {
          console.warn(
            'No meetingId from totalEngagement, skipping individual'
          );
          return;
        }

        // 2) 가져온 meetingId로 individualEngagement 호출
        const individualEngagement = await getIndividualEngagement(
          serverId,
          fetchedMeetingId
        );
        console.log(individualEngagement, 'individualEngagement');

        if (individualEngagement?.currentRate != null) {
          setParticipationRate(individualEngagement.currentRate);
        }
      } catch (error) {
        console.error('fetchParticipation error', error);
      }
    };

    fetchParticipation();
  }, [serverId]);

  const onClickFeedback = (serverId: string) => {
    router.push(`/main/${serverId}/feedback`);
  };

  const onClickSummary = (serverId: string) => {
    router.push(`/main/${serverId}/summary`);
  };

  return (
    <main
      className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 lg:p-24 gap-8 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: colors.black[100] }}
    >
      {/* 회의 참여율 섹션 */}
      <section className="w-full bg-[#1e1e1e] rounded-[48px] p-12 md:p-20 flex flex-col md:flex-row items-center justify-around gap-12 border border-white/5 shadow-2xl">
        <ParticipationChart size={chartSize + 40} percentage={ratePercent ?? 0} />
        <div className="flex flex-col gap-8 p-6 md:p-12">
          <h1
            className="text-white leading-tight"
            style={{
              ...typography.title.TitleB,
              fontSize: '3rem'
            }}
          >
            {displayName}님의 가장 최근{' '}
            <span className="text-[#ff5c00]">회의 참여율</span>
            은<br />
            전체 팀원 중{' '}
            <span className="text-[#ff5c00]">{ratePercent ?? '--'}%</span>{' '}
            입니다!
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed">
            참여율 기준은 회의 중 말의 빈도수가 얼마나
            <br /> 많았는지 리시브가 체크하여 반영됩니다.
          </p>
        </div>
      </section>
      {/* 회의 피드백 섹션 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <DashboardCard
          title="회의 피드백"
          description={
            <>
              Meezy.의 AI 도우미인 “리시브"가 <br />
              회의를 정리해 피드백 해서 회의의 질을 높여 드려요!
            </>
          }
          buttonText="회의 피드백 보기"
          onClick={() => onClickFeedback(serverId)}
        />

        <DashboardCard
          title="회의 요약"
          description={
            <>
              Meezy.의 AI 도우미인 “리시브"가 <br />
              회의를 정리해 요약해서 회의를 보다 더 관리하기 쉽게 도와줘요!
            </>
          }
          buttonText="회의 요약 보기"
          onClick={() => onClickSummary(serverId)}
        />
      </div>
    </main>
  );
}
