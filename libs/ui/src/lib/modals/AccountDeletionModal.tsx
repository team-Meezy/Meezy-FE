'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { typography, colors } from '../../design';
import { useRouter } from 'next/navigation';
import { useServerLoading } from '../../context';
import { deleteAccount } from '@org/shop-data';
import { PasswordInput } from './components';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDeletionModal({
  isOpen,
  onClose,
}: AccountDeletionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [password, setPassword] = useState('');
  const { setLoading, setLoadingState } = useServerLoading();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setGeneralError('');
    }
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleDelete = async () => {
    try {
      if (!password) {
        setGeneralError('비밀번호를 입력해주세요.');
        return;
      }
      await deleteAccount(password);
      setLoading(true);
      setLoadingState('회원탈퇴 되었습니다.');

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDelete();
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
        <div className="p-6 pt-4 flex flex-col gap-6 pb-0">
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white mb-1">회원탈퇴</h2>
            <p
              className="text-gray-400 mb-4"
              style={{ ...typography.body.BodyM }}
            >
              정말 탈퇴하시겠습니까?
            </p>
          </section>
        </div>

        <div className="px-6 py-2 flex flex-col gap-2">
          <PasswordInput
            id="password"
            label="비밀번호"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (generalError) setGeneralError('');
            }}
            hasError={!!generalError}
            errorMessage={generalError}
          />
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
            onClick={handleDelete}
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
