'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';
import { useModalImg } from '../../hooks/useModalImg';
import { useServerJoinedTeam } from '../../context/ServerJoinedTeamProvider';
import Link from '../assets/link.svg';

interface JoinedModalProps {
  isOpen: boolean;
  type: 'ROOM' | 'MEMBER' | null;
  onClose: () => void;
}

export function JoinedModal({ isOpen, type, onClose }: JoinedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverLink, setServerLink] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { previewUrl, fileInputRef, handleClickUpload, handleImageChange } =
    useModalImg();
  const { setJoined } = useServerJoinedTeam();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (generalError) {
      const timer = setTimeout(() => {
        setGeneralError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [generalError]);

  const createServer = () => {
    const valueToValidate = serverName;
    if (!valueToValidate) {
      setGeneralError('채널 이름을 입력해주세요.');
      return false;
    }

    setJoined(true);

    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(
    // 1. 배경 Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      {/* 2. 모달 컨테이너 */}
      <div className="w-[480px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 pt-4 flex flex-col gap-6">
          {/* 서버 이름 입력 */}
          <section>
            <h2
              className="text-white mb-3"
              style={{ ...typography.title.sTitleB }}
            >
              {type === 'ROOM' ? '채널 만들기' : '팀원 초대하기'}
            </h2>
            <p
              className="mb-4"
              style={{ ...typography.body.BodyM, color: colors.gray[300] }}
            >
              {type === 'ROOM'
                ? '채널을 만들어 다양한 소통을 즐겨보세요!'
                : '아래 링크를 공유하여 팀원을 초대하세요.'}
            </p>
            {generalError && type === 'ROOM' && (
              <div
                className="flex flex-col items-center justify-center w-[100%] p-4 rounded-lg mb-4"
                style={{
                  backgroundColor: '#fab1b1ff',
                  border: `1px solid ${'#ffa0a0ff'}`,
                }}
              >
                <p
                  style={{
                    ...typography.body.BodyM,
                    color: colors.system.error[500],
                  }}
                >
                  {generalError}
                </p>
              </div>
            )}

            <input
              type="text"
              value={serverLink}
              onChange={(e) => {
                setServerLink(e.target.value);
              }}
              placeholder={type === 'ROOM' ? '채널 이름' : 'http:sss....'}
              className="w-full border-none rounded-lg p-3 placeholder:text-gray-500 outline-none transition-all"
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[700],
                color: colors.white[100],
              }}
            />
          </section>
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-6 py-4 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#ff5c00] text-[#ff5c00] rounded-lg font-bold hover:bg-[#ff5c00]/10 transition-colors"
            style={{ ...typography.body.BodyB }}
          >
            닫기
          </button>
          <button
            onClick={createServer}
            className="flex-1 py-3 px-4 bg-[#ff5c00] text-white rounded-md font-bold hover:bg-[#e65300] transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
