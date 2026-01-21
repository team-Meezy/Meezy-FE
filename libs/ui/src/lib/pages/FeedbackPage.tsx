'use client';

import { typography, colors } from '../../design';

const FeedbackList = [
  {
    FeedbackId: 1,
    title: '효현이 머리카락을 왜 저럴까',
    date: '2026-01-19',
    description: '회의 내용',
  },
  {
    FeedbackId: 2,
    title: '효현이 머리카락을 왜 저럴까',
    date: '2026-01-19',
    description: '회의 내용',
  },
];

export function FeedbackPage() {
  return (
    <div className="flex-[3] border border-white/5 flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-full h-full bg-[#1e1e1e] rounded-2xl flex flex-col overflow-y-scroll no-scrollbar">
        <h1 className="p-6" style={{ ...typography.title.sTitleB }}>
          회의 피드백
        </h1>
        <div className="flex flex-col gap-5 px-6">
          {FeedbackList.map((feedback) => (
            <div
              key={feedback.FeedbackId}
              className="max-h-[150px] p-6 rounded-2xl flex flex-col gap-2 overflow-y-scroll no-scrollbar"
              style={{ backgroundColor: colors.gray[700] }}
            >
              <div className="flex gap-2 items-center">
                <h2 style={{ ...typography.body.BodyB }}>{feedback.title}</h2>
                <p
                  style={{
                    ...typography.body.BodyM,
                    color: colors.primary[500],
                  }}
                >
                  {feedback.date}
                </p>
              </div>
              <p style={{ ...typography.label.labelM }}>
                {feedback.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
