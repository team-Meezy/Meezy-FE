import { useEffect, useCallback, useState, useRef } from 'react';
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
  const {
    meetingId,
    setMeetingId,
    setTeamId,
    isUploading,
    setHasActiveMeeting,
    setStartTime,
  } = useMeetingStore();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const { setLoading, setLoadingState } = useLoadingStore();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const { hasActiveMeeting } = useMeetingStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const currentTeamId = params.serverId as string;

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const meetingRef = useRef(meeting);
  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  const isUploadingRef = useRef(isUploading);
  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

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
      setIsSyncing(true);
      const activeMeetings = await getActiveMeetings(currentTeamId);
      const myId =
        profile.id || profile.userId || profile.user_id || profile.accountId;
      const currentPath = pathnameRef.current;

      const now = new Date().toLocaleTimeString();
      console.log(
        `[${now}] Header: checkActiveMeeting response`,
        activeMeetings
      );

      if (!activeMeetings || !activeMeetings.meetingId) {
        setHasActiveMeeting(false);
        setStartTime(null);
        // 서버 동기화 지연일 수 있으므로 로컬에서 참여 중(`meetingRef.current === true`)이라면 
        // 즉각적으로 종료하지 않음 (단, 회의 밖일 때만 적용됨)
        if (!meetingRef.current && !currentPath.includes('/meeting')) {
          setMeetingId('');
          setMeeting(false);
        }
        return;
      }

      setHasActiveMeeting(true);
      const newStartTime = activeMeetings.startTime || activeMeetings.createdAt;
      if (newStartTime) {
        setStartTime(newStartTime);
      }
      const isParticipant =
        Array.isArray(activeMeetings.participants) &&
        activeMeetings.participants.some(
          (p: any) => (p.userId || p.id || p.user_id) === myId
        );

      console.log(
        `[${now}] Header: isParticipant: ${isParticipant}, pathname: ${currentPath}`
      );

      // 이미 참여 중인 경우에만 상태 유지
      if (isParticipant) {
        setMeetingId(activeMeetings.meetingId);
        setTeamId(currentTeamId);
        setMeeting(true);
      } else {
        // 서버에서 참여자가 아니라고 해도, 로컬에서 주도적으로 참여 중(`meetingRef.current === true`)이라면
        // 서버의 참여자 목록 동기화가 지연된 것일 수 있으므로 함부로 로컬 상태를 끄지 않습니다.
        if (!meetingRef.current && !currentPath.includes('/meeting')) {
          console.log(
            `[${now}] Header: Not participant, not on meeting, and not active locally. Resetting.`
          );
          setMeeting(false);
          setMeetingId('');
        }
      }
    } catch (error) {
      console.log('Header: getActiveMeetings error', error);
      setHasActiveMeeting(false);
    } finally {
      setIsSyncing(false);
    }
  }, [currentTeamId, !!profile]);

  useEffect(() => {
    if (pathname.includes('/meeting') && !meeting) {
      console.log(
        'Header: On meeting page but meeting state is false, setting to true.'
      );
      setMeeting(true);
    }
    checkActiveMeeting();
  }, [pathname, checkActiveMeeting]);

  // 외부(웹소켓 레이아웃 등)에서 싱크를 트리거할 수 있도록 이벤트 리스너 등록
  useEffect(() => {
    const handleSync = () => {
      console.log('Header: [EVENT] meezy:sync-meeting received');
      checkActiveMeeting();
    };
    window.addEventListener('meezy:sync-meeting', handleSync);
    return () => window.removeEventListener('meezy:sync-meeting', handleSync);
  }, [checkActiveMeeting]);

  // 브라우저 종료/종료 시 세션 정리
  useEffect(() => {
    const handleUnload = () => {
      if (meeting && currentTeamId) {
        leaveMeeting(currentTeamId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [meeting, currentTeamId]);

  // 업로드 완료 후 자동 이동 처리
  // 이 로직이 '복귀' 시 레이스 컨디션을 유발하므로 isSyncing 상태와 수동 조작 우선순위를 고려합니다.
  useEffect(() => {
    let timeoutId: any;
    if (
      !isSyncing && // 싱크 중이 아닐 때만 판단
      meeting === false &&
      isUploading === false &&
      pathname.includes('/meeting')
    ) {
      timeoutId = setTimeout(() => {
        if (
          meetingRef.current === false &&
          isUploadingRef.current === false &&
          pathnameRef.current.includes('/meeting')
        ) {
          const now = new Date().toLocaleTimeString();
          console.log(
            `[${now}] Header: [AUTO] No active meeting detected on meeting page, navigating back to dashboard.`
          );
          setLoading(false);
          setLoadingState('');
          router.push(`/main/${currentTeamId}`);
        }
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [meeting, isUploading, pathname, currentTeamId, router, isSyncing, setLoading, setLoadingState]);

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
        setStartTime(null);
        
        // 만약 미팅 페이지가 아닌 곳(대시보드 등)에서 '나가기'를 눌렀다면
        // 자동라우팅 Effect가 발동하지 않으므로 여기서 로딩 상태를 해제해야 합니다.
        if (!pathname.includes('/meeting')) {
            setLoading(false);
            setLoadingState('');
        }
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
        setHasActiveMeeting(true);
        setStartTime(new Date().toISOString());
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
        {profile?.profileImageUrl || profile?.profileImage ? (
          <img
            src={profile.profileImageUrl || profile.profileImage}
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