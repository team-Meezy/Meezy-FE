'use client';

import { colors, typography } from '@meezy/ui';
import { useServerJoinedTeam } from '../context/ServerJoinedTeamProvider';
import { useRouter } from 'next/navigation';
import { useServerState } from '../context/ServerStateProvider';

export function Header() {
  const { joined, meeting, setMeeting } = useServerJoinedTeam();
  const { setJoined } = useServerState();

  const router = useRouter();

  const onClickMain = (serverId: number) => {
    router.push(`/main/${serverId}`);
  };

  const onClickMypage = () => {
    setJoined(true);
    router.push('/main/mypage');
  };

  return (
    <header
      className="w-full flex justify-between items-center p-6 border-l border-white/5"
      style={{
        ...typography.body.BodyM,
        backgroundColor: colors.black[100],
      }}
    >
      {/* 서비스 로고 */}
      <h1
        className="text-[#ff5c00] font-extrabold text-2xl tracking-tight cursor-pointer"
        onClick={() => onClickMain(1)}
      >
        Meezy.
      </h1>

      {/* 우측 유저 프로필 (이미지에서는 전체 레이아웃 우측 상단에 위치) */}
      <div className="flex items-center gap-10">
        {joined && (
          <button
            className="py-3 px-6 rounded-full cursor-pointer transition-opacity hover:opacity-80"
            style={{
              color: colors.white[100],
              backgroundColor: meeting
                ? colors.system.error[500]
                : colors.primary[500],
              ...typography.body.BodyM,
            }}
            onClick={() => setMeeting(!meeting)}
          >
            {meeting ? '회의 나가기' : '회의 시작'}
          </button>
        )}
        <div
          className="w-10 h-10 bg-[#d9d9d9] rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            ...typography.body.BodyM,
            backgroundColor: colors.white[100],
          }}
          onClick={() => {
            onClickMypage();
          }}
        />
      </div>
    </header>
  );
}
