'use client';

import { useMemo, useState } from 'react';
import { colors, typography } from '../../design';
import { MeetingMarkdown } from './MeetingMarkdown';

type InsightItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  participantCount?: number;
  participantsCount?: number;
  memberCount?: number;
};

function formatMeetingDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

function resolveParticipantCount(item: InsightItem) {
  const countCandidates = [
    item.participantCount,
    item.participantsCount,
    item.memberCount,
  ];

  const count = countCandidates.find(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );

  return count != null ? `${count}명` : '-명';
}

export function MeetingInsightAccordionList({
  items,
  emptyMessage,
}: {
  items: InsightItem[];
  emptyMessage: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [items]
  );

  if (sortedItems.length === 0) {
    return (
      <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sortedItems.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-[28px] bg-[#3a3a3a] transition-colors"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-white"
                  style={{ ...typography.body.BodyB }}
                >
                  {item.title}
                </div>
                <div
                  className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/65"
                  style={{ ...typography.label.labelM }}
                >
                  <span>{resolveParticipantCount(item)}</span>
                  <span>{formatMeetingDate(item.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="text-white/55"
                  style={{ ...typography.label.labelM }}
                >
                  {isOpen ? '접기' : '열기'}
                </span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/15 text-white transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </button>

            {isOpen ? (
              <div className="bg-[#2e2e2e] px-6 py-5">
                <MeetingMarkdown content={item.content} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
