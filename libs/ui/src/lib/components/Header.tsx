import { useEffect, useCallback } from 'react';
import { colors, typography } from '../../design';
import { useServerJoinedTeam, useProfile } from '../../context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import {
  startMeeting,
  leaveMeeting,
  getActiveMeetings,
  uploadMeetingRecording,
} from '@org/shop-data';
import { useMeetingStore } from '@org/shop-data';

export function Header() {
  const { joined, setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const { meetingId, setMeetingId } = useMeetingStore();
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
        if (!pathname.includes('/meeting')) {
          setMeetingId('');
          setMeeting(false);
        }
        return;
      }

      const isParticipant = activeMeetings.participants?.some(
        (p: any) => (p.userId || p.id || p.user_id) === myId
      );

      if (isParticipant) {
        setMeetingId(activeMeetings.meetingId);
        setMeeting(true);
      } else {
        if (!pathname.includes('/meeting')) {
          setMeetingId(activeMeetings.meetingId);
          setMeeting(false);
        }
      }
    } catch (error) {
      console.log('Header: getActiveMeetings error', error);
    }
  }, [currentTeamId, !!profile, pathname]); // profile 객체 전체 대신 존재 여부만 체크

  useEffect(() => {
    if (pathname.includes('/meeting') && !meeting) {
      setMeeting(true);
    }
    checkActiveMeeting();
  }, [pathname, checkActiveMeeting]); // checkActiveMeeting은 이제 훨씬 안정적임

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
      // 회의 종료 시 녹음 중지 및 업로드 이벤트를 발생시킵니다.
      const now = new Date().toLocaleTimeString();
      console.log(
        `[${now}] Header: [EXIT] Dispatching meezy:stop-and-upload. current meetingId: ${meetingId}`
      );
      window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));

      try {
        console.log(`[${now}] Header: [EXIT] Calling leaveMeeting...`);
        await leaveMeeting(currentTeamId);
        setMeeting(false); // API 성공 시 즉시 상태 변경

        // [중요] 업로드 처리를 위해 더 충분히 대기 (5초)
        console.log(
          `[${now}] Header: [EXIT] Waiting 5s for upload to complete...`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log(
          `[${new Date().toLocaleTimeString()}] Header: [EXIT] Navigating back to main`
        );
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
          console.log(res.meetingId, 'meetingId.startMeeting');
        }
        router.push(`/main/${currentTeamId}/meeting`);
      } catch (error) {
        console.log('startMeeting error', error);
        alert('회의 시작에 실패했습니다.');
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
