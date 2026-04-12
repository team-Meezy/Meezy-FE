'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getMeetingSummaries,
  type MeetingSummaryResponse,
} from '@org/shop-data';
import { typography, colors } from '../../design';
import { MeetingInsightAccordionList } from '../components';

export function SummaryPage() {
  const params = useParams();
  const teamId = params.serverId as string;
  const [summaries, setSummaries] = useState<MeetingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const data = await getMeetingSummaries(teamId);

        setSummaries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch summaries', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchSummaries();
  }, [teamId]);

  return (
    <div className="flex-[3] flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-full h-full bg-[#1e1e1e] rounded-2xl flex flex-col overflow-y-scroll no-scrollbar">
        <h1 className="p-6" style={{ ...typography.title.sTitleB }}>
          회의 요약
        </h1>
        <div className="px-6 pb-6">
          {loading ? (
            <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
              로딩 중입니다...
            </p>
          ) : (
            <MeetingInsightAccordionList
              items={summaries.map((summary) => ({
                id: summary.summaryId,
                title: summary.title,
                content: summary.content,
                createdAt: summary.createdAt,
                participantCount: summary.participantCount,
                participantsCount: summary.participantsCount,
                memberCount: summary.memberCount,
              }))}
              emptyMessage="생성된 회의 요약이 없습니다."
            />
          )}
        </div>
      </div>
    </div>
  );
}
