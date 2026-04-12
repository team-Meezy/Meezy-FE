'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getMeetingFeedbacks,
  type MeetingFeedbackResponse,
} from '@org/shop-data';
import { typography, colors } from '../../design';
import { MeetingInsightAccordionList } from '../components';

export function FeedbackPage() {
  const params = useParams();
  const teamId = params.serverId as string;
  const [feedbacks, setFeedbacks] = useState<MeetingFeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const data = await getMeetingFeedbacks(teamId);

        setFeedbacks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch feedbacks', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchFeedbacks();
  }, [teamId]);

  return (
    <div className="flex-[3] flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-full h-full bg-[#1e1e1e] rounded-2xl flex flex-col overflow-y-scroll no-scrollbar">
        <h1 className="p-6" style={{ ...typography.title.sTitleB }}>
          회의 피드백
        </h1>
        <div className="px-6 pb-6">
          {loading ? (
            <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
              로딩 중입니다...
            </p>
          ) : (
            <MeetingInsightAccordionList
              items={feedbacks.map((feedback) => ({
                id: feedback.feedbackId,
                title: feedback.title,
                content: feedback.content,
                createdAt: feedback.createdAt,
                participantCount: feedback.participantCount,
                participantsCount: feedback.participantsCount,
                memberCount: feedback.memberCount,
              }))}
              emptyMessage="생성된 회의 피드백이 없습니다."
            />
          )}
        </div>
      </div>
    </div>
  );
}
