import { useEffect, useCallback } from 'react';
import { colors, typography } from '../../design';
import { useServerJoinedTeam, useProfile } from '../../context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { startMeeting, leaveMeeting, getActiveMeetings } from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';

export function Header() {
  const { joined, setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const { setMeetingId } = useMeetingStore();
  const { profile } = useProfile();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTeamId = params.serverId as string;

  const checkActiveMeeting = useCallback(async () => {
    if (!currentTeamId || !profile) return;

    try {
      const activeMeetings = await getActiveMeetings(currentTeamId);

      const myId =
        profile.userId || profile.id || profile.user_id || profile.accountId;

      if (!activeMeetings || !activeMeetings.meetingId) {
        // 미팅 페이지(`/meeting`)가 아닐 때만 미팅 상태를 해제합니다.
        if (!pathname.includes('/meeting')) {
          setMeetingId('');
          setMeeting(false);
        }
        return;
      }

      // 현재 유저가 참가자 명단에 있는지 확인
      const isParticipant = activeMeetings.participants?.some(
        (p: any) => (p.userId || p.id || p.user_id) === myId
      );

      if (isParticipant) {
        setMeetingId(activeMeetings.meetingId);
        setMeeting(true);
      } else {
        // 이미 미팅 페이지에 진입했거나 버튼을 통해 상태가 변경된 경우,
        // stale한 API 응답(204 등)으로 인해 상태가 꼬이지 않도록 경로를 체크합니다.
        if (!pathname.includes('/meeting')) {
          setMeetingId(activeMeetings.meetingId);
          setMeeting(false);
        }
      }
    } catch (error) {
      console.log('Header: getActiveMeetings error', error);
    }
  }, [currentTeamId, profile, setMeeting, setMeetingId, pathname]);

  useEffect(() => {
    // 1. 초기 경로 동기화 (회의 페이지라면 즉시 회의 중으로 표시)
    if (pathname.includes('/meeting')) {
      setMeeting(true);
    }

    // 2. 서버 데이터와 동기화
    checkActiveMeeting();
  }, [checkActiveMeeting, pathname, setMeeting]);

  const onClickMain = () => {
    router.push(`/main/${currentTeamId}`);
  };

  const onClickMypage = () => {
    setJoined(false);
    router.push('/main/mypage');
  };

  const onClickMeeting = async () => {
    if (meeting) {
      // 회의 나가기
      try {
        await leaveMeeting(currentTeamId);
        setMeeting(false); // API 성공 시 즉시 상태 변경
        setMeetingId('');
        router.push(`/main/${currentTeamId}`);
      } catch (error) {
        console.log('leaveMeeting error', error);
        alert('회의 나가기에 실패했습니다.');
      }
    } else {
      // 회의 시작
      try {
        const res = await startMeeting(currentTeamId);
        setMeeting(true); // API 성공 시 즉시 상태 변경
        if (res?.meetingId) {
          setMeetingId(res.meetingId);
        }
        router.push(`/main/${currentTeamId}/meeting`);
      } catch (error) {
        console.log('startMeeting error', error);
        alert('회의 시작에 실패했습니다.');
      }
    }
  };
  streams: return (
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
