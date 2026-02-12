'use client';

import { colors, typography } from '../../../design';

interface ProfileIdentityProps {
  userName: string;
  setUserName: (name: string) => void;
  userId: string;
  userEmail: string;
}

export function ProfileIdentity({
  userName,
  setUserName,
  userId,
  userEmail,
}: ProfileIdentityProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 이름 필드 */}
      <div className="flex flex-col gap-3">
        <label htmlFor="profile-name" style={{ ...typography.body.BodyB }}>
          이름
        </label>
        <input
          type="text"
          id="profile-name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full max-w-lg h-10 px-4 rounded-lg outline-none border border-transparent focus:border-[#FF5C00] transition-all"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            ...typography.body.BodyM,
          }}
        />
      </div>

      <hr className="border-white/10" />

      {/* 아이디 필드 */}
      <div className="flex flex-col gap-3">
        <label htmlFor="profile-id" style={{ ...typography.body.BodyB }}>
          아이디
        </label>
        <input
          type="text"
          id="profile-id"
          value={userId}
          readOnly
          className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            ...typography.body.BodyM,
          }}
        />
      </div>

      <hr className="border-white/10" />

      <div className="flex justify-between w-full">
        {/* 이메일 필드 */}
        <div className="flex flex-col gap-3 min-w-[70%]">
          <label htmlFor="profile-email" style={{ ...typography.body.BodyB }}>
            이메일
          </label>
          <input
            type="email"
            id="profile-email"
            value={userEmail}
            readOnly
            className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
            style={{
              backgroundColor: '#1C1C1E',
              color: '#FFFFFF',
              ...typography.body.BodyM,
            }}
          />
        </div>

        {/* 저장하기 버튼 */}
        <div className="flex justify-end w-full items-end">
          <button
            className="px-8 py-3 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
            style={{
              backgroundColor: colors.primary[500],
              color: colors.white[100],
              ...typography.body.BodyB,
            }}
          >
            저장하기
          </button>
        </div>
      </div>
    </section>
  );
}
