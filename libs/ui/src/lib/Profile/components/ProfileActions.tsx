'use client';

import { colors, typography } from '../../../design';

interface ProfileActionsProps {
  onConfirmModalOpen: () => void;
  Title: (title: string) => void;
  Description: (description: string) => void;
}

export function ProfileActions({
  onConfirmModalOpen,
  Title,
  Description,
}: ProfileActionsProps) {
  const handleLogoutClick = () => {
    Title('로그아웃');
    Description('로그아웃 하시겠습니까?');
    onConfirmModalOpen();
  };

  const handleWithdrawClick = () => {
    Title('회원 탈퇴');
    Description('회원 탈퇴 하시겠습니까?');
    onConfirmModalOpen();
  };

  const handlePasswordChangeClick = () => {
    // Title('비밀번호 변경');
    // Description('비밀번호를 변경하시겠습니까?');
    // onConfirmModalOpen();
  };

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 style={{ ...typography.body.LBodyB }}>비밀번호 변경</h2>

        <button
          type="button"
          className="px-3 py-3 rounded-md bg-[#FF5C00] hover:bg-[#E55200] transition-colors mt-4"
          style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
          onClick={handlePasswordChangeClick}
        >
          비밀번호 변경
        </button>
      </div>

      <hr className="border-white/10" />

      <div>
        <h2 style={{ ...typography.body.LBodyB }}>로그아웃 / 회원 탈퇴</h2>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="px-3 py-3 rounded-md bg-[#FF5C00] hover:bg-[#E55200] transition-colors"
            style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
            onClick={handleLogoutClick}
          >
            로그아웃
          </button>

          <button
            type="button"
            className="px-3 py-3 rounded-md hover:bg-[#E55200] transition-colors"
            style={{
              ...typography.body.BodyB,
              color: '#FFFFFF',
              backgroundColor: colors.gray[900],
            }}
            onClick={handleWithdrawClick}
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </section>
  );
}
