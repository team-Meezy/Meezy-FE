'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { typography, colors } from '../../design';
import { getMeetingSummaries } from '@org/shop-data';

export function SummaryPage() {
  const params = useParams();
  const teamId = params.serverId as string;
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const data = await getMeetingSummaries(teamId);

        if (data && Array.isArray(data)) {
          // 최신순 정렬 등 필요시 추가 가능
          setSummaries(data);
        } else {
          setSummaries([]);
        }
      } catch (error) {
        console.error('Failed to fetch summaries', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [teamId]);

  return (
    <div className="flex-[3] border border-white/5 flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-full h-full bg-[#1e1e1e] rounded-2xl flex flex-col overflow-y-scroll no-scrollbar">
        <h1 className="p-6" style={{ ...typography.title.sTitleB }}>
          회의 요약
        </h1>
        <div className="flex flex-col gap-5 px-6 pb-6">
          {loading ? (
            <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
              로딩 중입니다...
            </p>
          ) : summaries.length === 0 ? (
            <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
              생성된 회의 요약이 없습니다.
            </p>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.summaryId}
                className="max-h-[150px] p-6 rounded-2xl flex flex-col gap-2 overflow-y-scroll no-scrollbar"
                style={{ backgroundColor: colors.gray[700] }}
              >
                <div className="flex justify-between items-center">
                  <h2 style={{ ...typography.body.BodyB }}>
                    {/* API에 title 필드가 없다면 임시로 요약 텍스트의 앞부분이나 meetingId를 활용 */}
                    {summary.title || '회의 요약본'}
                  </h2>
                  <p
                    style={{
                      ...typography.body.BodyM,
                      color: colors.primary[500],
                    }}
                  >
                    {new Date(summary.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p
                  style={{ ...typography.label.labelM, whiteSpace: 'pre-wrap' }}
                >
                  {summary.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
