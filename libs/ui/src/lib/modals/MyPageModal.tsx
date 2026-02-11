'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { typography, colors } from '../../design';
import { useRouter } from 'next/navigation';
import { useServerLoading } from '../../context';
import { deleteAccount } from '@org/shop-data';

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
  const [password, setPassword] = useState('');
  const { setLoading, setLoadingState } = useServerLoading();

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

  const handleLogout = async () => {
    try {
      setLoading(true);

      if (title === '로그아웃') {
        setLoadingState('로그아웃 되었습니다.');
      } else if (title === '회원탈퇴') {
        if (!password) {
          setGeneralError('비밀번호를 입력해주세요.');
          setLoading(false);
          return;
        }
        await deleteAccount(password);
        setLoadingState('회원탈퇴 되었습니다.');
      }

      // API 호출 성공 후 정보 삭제 및 이동
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('profile');

      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push('/login');
      onClose();
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      const message = error.response?.data?.message || '처리에 실패했습니다.';
      setGeneralError(message);
    }
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
        <div
          className={`p-6 pt-4 flex flex-col gap-6 ${
            title === '회원탈퇴' ? 'pb-0' : ''
          }`}
        >
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

          {generalError && (
            <p
              className="text-red-500 text-sm"
              style={{ ...typography.body.BodyM }}
            >
              {generalError}
            </p>
          )}
        </div>

        {title === '회원탈퇴' && (
          <div className="px-6 py-2 flex flex-col gap-2">
            <label htmlFor="password" className="text-white">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-none rounded-md focus:outline-none"
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[700],
                color: colors.white[100],
              }}
            />
          </div>
        )}

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
            onClick={handleLogout}
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
