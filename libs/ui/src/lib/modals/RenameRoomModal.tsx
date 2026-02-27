'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';

interface RenameRoomModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export function RenameRoomModal({
  isOpen,
  currentName,
  onClose,
  onRename,
}: RenameRoomModalProps) {
  const [newName, setNewName] = useState(currentName);
  const mounted = typeof window !== 'undefined';

  useEffect(() => {
    setNewName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = () => {
    if (newName.trim() && newName !== currentName) {
      onRename(newName.trim());
    } else if (newName === currentName) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="w-[400px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-white" style={{ ...typography.title.sTitleB }}>
            채널 이름 변경
          </h2>

          <div className="flex flex-col gap-2">
            <label
              style={{ ...typography.label.labelB, color: colors.gray[300] }}
            >
              채널 이름
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="w-full border-none rounded-lg p-3 outline-none transition-all"
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[800],
                color: colors.white[100],
              }}
            />
          </div>
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
            onClick={handleSubmit}
            disabled={!newName.trim() || newName === currentName}
            className="px-4 py-2 bg-[#ff5c00] hover:bg-[#e65300] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-bold transition-colors"
            style={{ ...typography.body.BodyB }}
          >
            변경사항 저장
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
