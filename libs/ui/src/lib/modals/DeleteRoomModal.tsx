'use client';

import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';

interface DeleteRoomModalProps {
  isOpen: boolean;
  roomName: string;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteRoomModal({
  isOpen,
  roomName,
  onClose,
  onDelete,
}: DeleteRoomModalProps) {
  const mounted = typeof window !== 'undefined';

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-room-title"
        className="w-[400px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-6 flex flex-col gap-4">
          <h2
            id="delete-room-title"
            className="text-white"
            style={{ ...typography.title.sTitleB }}
          >
            채널 삭제
          </h2>
          <p style={{ ...typography.body.BodyM, color: colors.gray[300] }}>
            정말로 <span className="text-white font-bold">#{roomName}</span>{' '}
            채널을 삭제하시겠습니까? <br />이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        <div className="px-6 py-4 bg-[#232428] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white hover:underline transition-all"
            style={{ ...typography.body.BodyB }}
          >
            취소
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-[#da373c] hover:bg-[#a12829] text-white rounded-md font-bold transition-colors"
            style={{ ...typography.body.BodyB }}
          >
            채널 삭제
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
