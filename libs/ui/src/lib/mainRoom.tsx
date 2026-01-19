'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../design';
import { ParticipationChart } from './ParticipationChart';
import { DashboardCard } from './DashboardCard';

interface MainRoomProps {
  setFeedback: (open: boolean) => void;
  setSummary: (open: boolean) => void;
}

export function MainRoom({ setFeedback, setSummary }: MainRoomProps) {
  const [chartSize, setChartSize] = useState(192);

  useEffect(() => {
    const calc = () => setChartSize(Math.min(window.innerWidth * 0.1, 240));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <main
      className="flex-[3] border border-white/5 flex flex-col items-center justify-center p-10 gap-3"
      style={{ backgroundColor: colors.black[100] }}
    >
      {/* 회의 참여율 섹션 */}
      <section className="w-full bg-[#1e1e1e] rounded-3xl p-12 flex items-center justify-around">
        <ParticipationChart size={chartSize} percentage={87.5} />
        <div className="flex flex-col gap-3 p-10">
          <h1
            className="text-white leading-snug"
            style={{
              ...typography.title.TitleB,
            }}
          >
            손희찬님의 가장 최근{' '}
            <span className="text-[#ff5c00]">회의 참여율</span>
            은<br />
            전체 팀원 중 <span className="text-[#ff5c00]">87.5%</span> 입니다!
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
          description={
            <>
              Meezy.의 AI 도우미인 “리시브"가 <br />
              회의를 정리해 피드백 해서 회의의 질을 높여 드려요!
            </>
          }
          buttonText="회의 피드백 보기"
          onClick={() => setFeedback(true)}
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
          onClick={() => setSummary(true)}
        />
      </div>
    </main>
  );
}
