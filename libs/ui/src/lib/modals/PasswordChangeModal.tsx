'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { typography, colors } from '../../design';
import { useServerLoading } from '../../context';
import { updatePassword } from '@org/shop-data';
import { PasswordInput } from './components';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordChangeModal({
  isOpen,
  onClose,
}: PasswordChangeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { setLoading, setLoadingState } = useServerLoading();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handlePasswordChange = async () => {
    try {
      if (!password) {
        setGeneralError('현재 비밀번호를 입력해주세요.');
        return;
      } else if (!newPassword) {
        setGeneralError('새 비밀번호를 입력해주세요.');
        return;
      } else if (newPassword.length < 6 || newPassword.length > 15) {
        setGeneralError('새 비밀번호는 6~15글자 사이여야 합니다.');
        return;
      }
      await updatePassword(password, newPassword);
      setLoading(true);
      setLoadingState('비밀번호가 변경되었습니다.');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLoading(false);
      onClose();
    } catch (error: any) {
      console.error(error);
      setLoading(false);

      const statusCode = error.response?.status || error.statusCode;
      const message = error.response?.data?.message || error.message;
      if (statusCode === 400) {
        setGeneralError('현재 비밀번호가 일치하지 않습니다.');
      } else if (statusCode === 401) {
        setGeneralError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else if (statusCode === 403) {
        setGeneralError('접근 권한이 없습니다.');
      } else if (statusCode === 404) {
        setGeneralError('존재하지 않는 계정입니다.');
      } else if (statusCode === 409) {
        setGeneralError('허용되지 않는 요청입니다.');
      } else if (statusCode === 500) {
        setGeneralError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setGeneralError(message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordChange();
    }
  };

  if (!isOpen || !mounted) return null;

  const showCurrentPasswordError =
    generalError === '현재 비밀번호를 입력해주세요.' ||
    generalError === '현재 비밀번호가 일치하지 않습니다.';
  const showNewPasswordError =
    generalError === '새 비밀번호를 입력해주세요.' ||
    generalError === '새 비밀번호는 6~15글자 사이여야 합니다.';
  const showGeneralError =
    generalError && !showCurrentPasswordError && !showNewPasswordError;

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
            <h2 className="text-xl font-bold text-white mb-1">비밀번호 변경</h2>
            <p
              className="text-gray-400 mb-4"
              style={{ ...typography.body.BodyM }}
            >
              비밀번호를 변경하시겠습니까?
            </p>
          </section>
        </div>

        <div className="px-6 py-2 flex flex-col gap-2">
          <PasswordInput
            id="password"
            label="현재 비밀번호"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (generalError) setGeneralError('');
            }}
            hasError={showCurrentPasswordError}
            errorMessage={showCurrentPasswordError ? generalError : undefined}
          />

          <PasswordInput
            id="newPassword"
            label="새 비밀번호"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              if (generalError) setGeneralError('');
            }}
            hasError={!!generalError && !newPassword}
            errorMessage={showNewPasswordError ? generalError : undefined}
          />

          {showGeneralError && (
            <div className="flex items-center gap-1 my-1">
              <span className="text-red-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <p
                className="text-red-500 text-sm"
                style={{ ...typography.body.BodyM }}
              >
                {generalError}
              </p>
            </div>
          )}
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
            onClick={handlePasswordChange}
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
