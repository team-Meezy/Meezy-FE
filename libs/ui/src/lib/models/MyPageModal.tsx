'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';
import { useRouter } from 'next/navigation';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function MyPageModal({
  isOpen,
  onClose,
  title,
  description,
}: MyPageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const router = useRouter();

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

  const handleClick = () => {
    router.push('/login');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(
    // 1. 배경 Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mypage-modal-title"
      aria-describedby="mypage-modal-desc"
    >
      {/* 2. 모달 컨테이너 */}
      <div className="w-[480px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        {/* // 폼 콘텐츠 */}
        <div className="p-6 pt-4 flex flex-col gap-6">
          {/* 서버 이름 입력 */}
          <section className="flex flex-col gap-2">
            <h2
              id="mypage-modal-title"
              className="text-xl font-bold text-white mb-1"
            >
              {title}
            </h2>
            <p
              id="mypage-modal-desc"
              className="text-gray-400 mb-4"
              style={{ ...typography.body.BodyM }}
            >
              {description}
            </p>
          </section>
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-6 py-4 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="flex py-3 px-6 border border-[#ff5c00] text-[#ff5c00] rounded-md hover:bg-[#ff5c00]/10 transition-colors"
            style={{ ...typography.body.LBodyB }}
          >
            닫기
          </button>
          <button
            onClick={handleClick}
            className="flex py-3 px-6 bg-[#ff5c00] text-white rounded-md hover:bg-[#e65300] transition-colors"
            style={{ ...typography.body.LBodyB }}
          >
            다음
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
