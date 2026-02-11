'use client';

import { LogoutModal } from './LogoutModal';
import { AccountDeletionModal } from './AccountDeletionModal';
import { PasswordChangeModal } from './PasswordChangeModal';

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
  if (title === '로그아웃') {
    return <LogoutModal isOpen={isOpen} onClose={onClose} />;
  }

  if (title === '회원탈퇴') {
    return <AccountDeletionModal isOpen={isOpen} onClose={onClose} />;
  }

  if (title === '비밀번호 변경') {
    return <PasswordChangeModal isOpen={isOpen} onClose={onClose} />;
  }

  return null;
}
