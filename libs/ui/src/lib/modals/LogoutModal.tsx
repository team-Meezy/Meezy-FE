'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { typography, colors } from '../../design';
import { useRouter } from 'next/navigation';
import { useServerLoading } from '../../context';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const [mounted, setMounted] = useState(false);
  const { setLoading, setLoadingState } = useServerLoading();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setLoadingState('로그아웃 되었습니다.');

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('profile');

      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push('/login');
      onClose();
    } catch (error: any) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogout();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      <div className="w-[480px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 pt-4 flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white mb-1">로그아웃</h2>
            <p
              className="text-gray-400 mb-4"
              style={{ ...typography.body.BodyM }}
            >
              정말 로그아웃 하시겠습니까?
            </p>
          </section>
        </div>

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
