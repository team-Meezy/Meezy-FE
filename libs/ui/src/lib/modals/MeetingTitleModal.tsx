'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';

interface MeetingTitleModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void | Promise<void>;
}

export function MeetingTitleModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: MeetingTitleModalProps) {
  const [title, setTitle] = useState('');
  const mounted = typeof window !== 'undefined';
  const trimmedTitle = title.trim();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  const handleSubmit = () => {
    if (!trimmedTitle || isSubmitting) {
      return;
    }

    void onSubmit(trimmedTitle);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-title-modal-title"
        className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !isSubmitting) {
            onClose();
          }
          if (event.key === 'Enter') {
            handleSubmit();
          }
        }}
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <h2
              id="meeting-title-modal-title"
              className="text-white"
              style={{ ...typography.title.sTitleB }}
            >
              회의 제목 입력
            </h2>
            <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
              회의를 시작하려면 제목을 먼저 입력해야 합니다.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="meeting-title-input"
              style={{ ...typography.label.labelB, color: colors.gray[300] }}
            >
              제목
            </label>
            <input
              id="meeting-title-input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 4월 2주차 스프린트 회의"
              autoFocus
              maxLength={100}
              className="w-full rounded-xl border border-white/10 px-4 py-3 outline-none transition-colors focus:border-[#ff5c00]"
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[800],
                color: colors.white[100],
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ ...typography.body.BodyB }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!trimmedTitle || isSubmitting}
            className="rounded-lg bg-[#ff5c00] px-4 py-2 text-white transition-colors hover:bg-[#e65300] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ ...typography.body.BodyB }}
          >
            {isSubmitting ? '시작 중...' : '회의 시작'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
