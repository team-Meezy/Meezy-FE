import { colors, typography } from '../../design';
import { useServerJoinedTeam, useProfile } from '../../context';
import { useRouter, useParams } from 'next/navigation';
import { startMeeting } from '@org/shop-data';

export function Header() {
  const { joined, setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const { profile } = useProfile();
  const params = useParams();
  const router = useRouter();

  const currentTeamId = params.serverId as string;

  const onClickMain = () => {
    router.push(`/main/${currentTeamId}`);
  };

  const onClickMypage = () => {
    setJoined(false);
    router.push('/main/mypage');
  };

  const onClickMeeting = async () => {
    if (meeting) {
      router.push(`/main/${currentTeamId}`);
      setMeeting(false);
    } else {
      try {
        await startMeeting(currentTeamId);
        router.push(`/main/${currentTeamId}/meeting`);
        setMeeting(true);
      } catch (error) {
        console.log('startMeeting error', error);
      }
    }
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
        onClick={() => onClickMain()}
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
            onClick={() => onClickMeeting()}
          >
            {meeting ? '회의 나가기' : '회의 시작'}
          </button>
        )}
        {profile?.profileImage ? (
          <img
            src={profile.profileImage}
            alt="profile"
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
            onClick={() => {
              onClickMypage();
            }}
          />
        ) : (
          <div
            className="w-10 h-10 bg-[#d9d9d9] rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              onClickMypage();
            }}
          />
        )}
      </div>
    </header>
  );
}
