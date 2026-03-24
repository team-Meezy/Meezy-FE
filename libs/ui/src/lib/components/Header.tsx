import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  joinMeeting,
  leaveMeeting,
  startMeeting,
  useLoadingStore,
  useMeetingStore,
} from '@org/shop-data';
import { colors, typography } from '../../design';
import { useProfile, useServerJoinedTeam, useServerState } from '../../context';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentTeamId = params.serverId as string;

  const { setJoined, meeting, setMeeting } = useServerJoinedTeam();
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const { setLoading, setLoadingState } = useLoadingStore();
  const {
    setMeetingId,
    setTeamId,
    isUploading,
    setHasActiveMeeting,
    setStartTime,
    hasActiveMeeting,
  } = useMeetingStore();

  const [isSyncing, setIsSyncing] = useState(false);

  const pathnameRef = useRef(pathname);
  const meetingRef = useRef(meeting);
  const isUploadingRef = useRef(isUploading);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  const myProfileId =
    profile?.id || profile?.userId || profile?.user_id || profile?.accountId;

  const myMemberInfo = useMemo(() => {
    return teamMembers?.find((member) => {
      const memberUserId =
        (member as any).userId ||
        (member as any).user_id ||
        (member as any).user?.id ||
        (member as any).user?.userId ||
        member.teamMemberId;

      if (myProfileId && memberUserId) {
        return String(myProfileId) === String(memberUserId);
      }

      return (
        member.name === profile?.name ||
        member.name === profile?.userName ||
        member.name === profile?.nickName
      );
    });
  }, [myProfileId, profile?.name, profile?.nickName, profile?.userName, teamMembers]);

  const isLeader = myMemberInfo?.role === 'LEADER';

  const checkActiveMeeting = useCallback(async () => {
    if (!currentTeamId || !profile) return;

    try {
      setIsSyncing(true);
      setTeamId(currentTeamId);
      const activeMeeting = await getActiveMeetings(currentTeamId);
      const currentPath = pathnameRef.current;

      if (!activeMeeting || !activeMeeting.meetingId) {
        setHasActiveMeeting(false);
        setStartTime(null);

        if (!meetingRef.current && !currentPath.includes('/meeting')) {
          setMeeting(false);
          setMeetingId('');
        }
        return;
      }

      setHasActiveMeeting(true);
      if (activeMeeting.startTime || activeMeeting.createdAt) {
        setStartTime(activeMeeting.startTime || activeMeeting.createdAt);
      }

      const isParticipant =
        Array.isArray(activeMeeting.participants) &&
        activeMeeting.participants.some(
          (participant: any) =>
            String(
              participant.userId || participant.id || participant.user_id
            ) === String(myProfileId)
        );

      if (isParticipant) {
        setMeeting(true);
        setMeetingId(activeMeeting.meetingId);
        setTeamId(currentTeamId);
      } else if (!meetingRef.current && !currentPath.includes('/meeting')) {
        setMeeting(false);
        setMeetingId('');
      }
    } catch (error) {
      console.log('Header: getActiveMeeting error', error);
      setHasActiveMeeting(false);
    } finally {
      setIsSyncing(false);
    }
  }, [
    currentTeamId,
    myProfileId,
    profile,
    setHasActiveMeeting,
    setMeeting,
    setMeetingId,
    setStartTime,
    setTeamId,
  ]);

  useEffect(() => {
    if (pathname.includes('/meeting') && !meeting) {
      setMeeting(true);
    }
    void checkActiveMeeting();
  }, [checkActiveMeeting, meeting, pathname, setMeeting]);

  useEffect(() => {
    const handleSync = () => {
      void checkActiveMeeting();
    };

    window.addEventListener('meezy:sync-meeting', handleSync);
    return () => window.removeEventListener('meezy:sync-meeting', handleSync);
  }, [checkActiveMeeting]);

  useEffect(() => {
    const handleUnload = () => {
      if (meetingRef.current && currentTeamId) {
        leaveMeeting(currentTeamId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentTeamId]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!isSyncing && !meeting && !isUploading && pathname.includes('/meeting')) {
      timeoutId = setTimeout(() => {
        if (
          !meetingRef.current &&
          !isUploadingRef.current &&
          pathnameRef.current.includes('/meeting')
        ) {
          setLoading(false);
          setLoadingState('');
          router.push(`/main/${currentTeamId}`);
        }
      }, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    currentTeamId,
    isSyncing,
    isUploading,
    meeting,
    pathname,
    router,
    setLoading,
    setLoadingState,
  ]);

  const onClickMain = () => {
    if (currentTeamId) {
      router.push(`/main/${currentTeamId}`);
      return;
    }

    router.push('/main');
  };

  const onClickMypage = () => {
    setJoined(false);
    router.push('/main/mypage');
  };

  const onClickMeeting = async () => {
    if (!currentTeamId) return;

    if (meeting) {
      try {
        setLoading(true);
        setLoadingState('Leaving meeting...');
        await leaveMeeting(currentTeamId);

        setMeeting(false);
        setHasActiveMeeting(false);
        setMeetingId('');
        setTeamId('');
        setStartTime(null);

        window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));
        window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));

        setLoading(false);
        setLoadingState('');

        if (pathname.includes('/meeting')) {
          router.push(`/main/${currentTeamId}`);
        }
        return;
      } catch (error) {
        console.log('leaveMeeting error', error);
        setLoading(false);
        setLoadingState('');
        alert('Failed to leave the meeting.');
        return;
      }
    }

    try {
      const response = isLeader
        ? await startMeeting(currentTeamId)
        : await joinMeeting(currentTeamId);

      setMeeting(true);
      setHasActiveMeeting(true);
      setStartTime(new Date().toISOString());
      setTeamId(currentTeamId);

      if (response?.meetingId) {
        setMeetingId(response.meetingId);
      }

      window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));
      router.push(`/main/${currentTeamId}/meeting`);
    } catch (error: any) {
      console.error(`${isLeader ? 'start' : 'join'}Meeting error:`, error);
      const errorMsg =
        error.response?.data?.message || error.message || 'Unknown error';
      alert(
        `${isLeader ? 'Start meeting' : 'Join meeting'} failed: ${errorMsg}`
      );
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
      <h1
        className="text-[#ff5c00] font-extrabold text-2xl tracking-tight cursor-pointer"
        onClick={onClickMain}
      >
        Meezy.
      </h1>

      <div className="flex items-center gap-10">
        {currentTeamId && (
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
            onClick={onClickMeeting}
          >
            {meeting ? 'Leave Meeting' : isLeader ? 'Start Meeting' : 'Join Meeting'}
          </button>
        )}

        {profile?.profileImageUrl || profile?.profileImage ? (
          <img
            src={profile.profileImageUrl || profile.profileImage}
            alt="profile"
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
            onClick={onClickMypage}
          />
        ) : (
          <div
            className="w-10 h-10 bg-[#d9d9d9] rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onClickMypage}
          />
        )}
      </div>
    </header>
  );
}
