import { useEffect, useCallback, useState } from 'react';
import { colors, typography } from '../../design';
import { useServerJoinedTeam, useProfile } from '../../context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import {
  startMeeting,
  joinMeeting,
  leaveMeeting,
  getActiveMeetings,
  uploadMeetingRecording,
} from '@org/shop-data';
import { useMeetingStore, useLoadingStore } from '@org/shop-data';
import { useServerState } from '../../context';

export function Header() {
  const { joined, setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const { meetingId, setMeetingId, setTeamId, isUploading } = useMeetingStore();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const { setLoading, setLoadingState } = useLoadingStore();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [hasActiveMeeting, setHasActiveMeeting] = useState(false);

  const currentTeamId = params.serverId as string;

  // 현재 로그인한 유저가 리더인지 확인
  const myMemberInfo = teamMembers?.find((m) => {
    const profileId =
      profile?.id ||
      profile?.userId ||
      profile?.user_id ||
      (profile as any)?.accountId;
    const memberUserId =
      (m as any).userId ||
      (m as any).user_id ||
      (m as any).user?.id ||
      (m as any).user?.userId ||
      m.teamMemberId;

    if (profileId && memberUserId && String(profileId) === String(memberUserId))
      return true;
    if (
      m.name === profile?.name ||
      m.name === profile?.userName ||
      m.name === profile?.nickName
    )
      return true;
    return false;
  });

  const isLeader = myMemberInfo?.role === 'LEADER';

  useEffect(() => {
    if (profile || teamMembers.length > 0) {
      console.log('Header: [DEBUG] profile', profile);
      console.log('Header: [DEBUG] teamMembersCount', teamMembers.length);
      console.log('Header: [DEBUG] myMemberInfo', myMemberInfo);
      console.log('Header: [DEBUG] isLeader', isLeader);
    }
  }, [profile, teamMembers, myMemberInfo, isLeader]);

  const checkActiveMeeting = useCallback(async () => {
    if (!currentTeamId || !profile) return;

    try {
      const activeMeetings = await getActiveMeetings(currentTeamId);
      const myId =
        profile.id || profile.userId || profile.user_id || profile.accountId;

      if (!activeMeetings || !activeMeetings.meetingId) {
        setHasActiveMeeting(false);
        if (!pathname.includes('/meeting')) {
          setMeetingId('');
          setMeeting(false);
        }
        return;
      }

      setHasActiveMeeting(true);
      const isParticipant =
        Array.isArray(activeMeetings.participants) &&
        activeMeetings.participants.some(
          (p: any) => (p.userId || p.id || p.user_id) === myId
        );

      // 이미 참여 중인 경우에만 상태 유지
      if (isParticipant) {
        setMeetingId(activeMeetings.meetingId);
        setTeamId(currentTeamId);
        setMeeting(true);
      } else {
        // 참여 중이 아니면 무조건 false (자동 참여 방지)
        setMeeting(false);
        // 여기서 setMeetingId/setTeamId를 부르지 않아야 useMeetingWebRTC가 미디어를 켜지 않음
      }
    } catch (error) {
      console.log('Header: getActiveMeetings error', error);
      setHasActiveMeeting(false);
    }
  }, [currentTeamId, !!profile, pathname]);

  useEffect(() => {
    if (pathname.includes('/meeting') && !meeting) {
      setMeeting(true);
    }
    checkActiveMeeting();
  }, [pathname, checkActiveMeeting]);

  // 브라우저 종료/종료 시 세션 정리
  useEffect(() => {
    const handleUnload = () => {
      if (meeting && currentTeamId) {
        // 동기적으로 호출하기 위해 beacon 사용을 고려하거나,
        // 간단한 fetch 호출 (브라우저가 중단할 수 있음)
        // 하지만 여기서는 leaveMeeting API를 최대한 호출 시도
        leaveMeeting(currentTeamId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [meeting, currentTeamId]);

  // 업로드 완료 후 자동 이동 처리
  useEffect(() => {
    if (
      meeting === false &&
      isUploading === false &&
      pathname.includes('/meeting')
    ) {
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] Header: [AUTO] Upload completed, navigating now.`);
      setLoading(false);
      setLoadingState('');
      router.push(`/main/${currentTeamId}`);
    }
  }, [meeting, isUploading, pathname, currentTeamId, router]);

  const onClickMain = () => {
    if (currentTeamId) {
      router.push(`/main/${currentTeamId}`);
    } else {
      router.push('/main');
    }
  };

  const onClickMypage = () => {
    setJoined(false);
    router.push('/main/mypage');
  };

  const onClickMeeting = async () => {
    if (meeting) {
      // 회의 나가기
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] Header: [EXIT] Starting exit flow...`);
      setLoading(true);
      setLoadingState('회의 내용을 저장 중입니다...');
      window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));

      try {
        console.log(`[${now}] Header: [EXIT] Calling leaveMeeting...`);
        await leaveMeeting(currentTeamId);
        setMeeting(false);
        setMeetingId('');
        setTeamId('');
        // 이제 자동 내비게이션 Effect가 isUploading이 false가 되면 처리합니다.
      } catch (error) {
        console.log('leaveMeeting error', error);
        setLoading(false);
        setLoadingState('');
        alert('회의 나가기에 실패했습니다.');
      }
    } else {
      // 회의 시작 또는 참가
      try {
        let res;
        console.log(
          `Header: [ACTION] ${
            isLeader ? 'Starting' : 'Joining'
          } meeting for team: ${currentTeamId}...`
        );
        if (isLeader) {
          res = await startMeeting(currentTeamId);
        } else {
          res = await joinMeeting(currentTeamId);
        }

        console.log(
          `Header: [DEBUG] ${isLeader ? 'start' : 'join'}Meeting response:`,
          res
        );
        setMeeting(true);
        if (res?.meetingId) {
          setMeetingId(res.meetingId);
          setTeamId(currentTeamId);
        } else {
          console.warn(
            `Header: [WARN] No meetingId returned from ${
              isLeader ? 'start' : 'join'
            }Meeting`
          );
        }
        router.push(`/main/${currentTeamId}/meeting`);
      } catch (error: any) {
        console.error(`${isLeader ? 'start' : 'join'}Meeting error:`, error);
        const errorMsg =
          error.response?.data?.message || error.message || '알 수 없는 에러';
        alert(
          `${isLeader ? '회의 시작' : '회의 참가'}에 실패했습니다: ${errorMsg}`
        );
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
                : isLeader || hasActiveMeeting
                ? colors.primary[500]
                : colors.gray[500],
              ...typography.body.BodyM,
            }}
            onClick={() => onClickMeeting()}
          >
            {meeting ? '회의 나가기' : isLeader ? '회의 시작' : '회의 참가'}
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
