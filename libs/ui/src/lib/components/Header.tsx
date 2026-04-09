import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  getActiveMeetings,
  joinMeeting,
  leaveMeeting,
  leaveMeetingOnUnload,
  MeetingEvent,
  startMeeting,
  useLoadingStore,
  useMeetingEvents,
  useMeetingStore,
} from '@org/shop-data';
import { colors, typography } from '../../design';
import { useProfile, useServerJoinedTeam, useServerState } from '../../context';

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getProfileId(profile: any) {
  return (
    profile?.id ||
    profile?.userId ||
    profile?.user_id ||
    profile?.accountId ||
    profile?.memberId
  );
}

function getProfileIds(profile: any) {
  return [
    profile?.id,
    profile?.userId,
    profile?.user_id,
    profile?.accountId,
    profile?.memberId,
    profile?.teamMemberId,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function getMemberIds(member: any) {
  return [
    member?.userId,
    member?.user_id,
    member?.accountId,
    member?.memberId,
    member?.teamMemberId,
    member?.id,
    member?.user?.id,
    member?.user?.userId,
    member?.user?.user_id,
    member?.user?.accountId,
    member?.user?.memberId,
    member?.user?.teamMemberId,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function getMemberRole(member: any) {
  return String(
    member?.role ||
      member?.memberRole ||
      member?.teamRole ||
      member?.authority ||
      member?.permission ||
      ''
  ).toUpperCase();
}

const LABEL_LEAVE_MEETING = '\uD68C\uC758 \uB098\uAC00\uAE30';
const LABEL_START_MEETING = '\uD68C\uC758 \uC2DC\uC791';
const LABEL_JOIN_MEETING = '\uD68C\uC758 \uCC38\uAC00';
const MESSAGE_LEAVING_MEETING =
  '\uD68C\uC758\uC5D0\uC11C \uB098\uAC00\uB294 \uC911\uC785\uB2C8\uB2E4...';
const MESSAGE_LEAVE_FAILED =
  '\uD68C\uC758 \uB098\uAC00\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
const MESSAGE_UNKNOWN_ERROR = '\uC54C \uC218 \uC5C6\uB294 \uC624\uB958';

import { useModalStore } from '@org/shop-data';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentTeamId = params.serverId as string;

  const { isSidebarOpen, setIsSidebarOpen } = useModalStore();
  const { setJoined, meeting, setMeeting } = useServerJoinedTeam();
// ... rest of imports/state ...
  const { profile } = useProfile();
  const { teamMembers } = useServerState();
  const { setLoading, setLoadingState } = useLoadingStore();
  const {
    meetingId,
    teamId: activeMeetingTeamId,
    setLastEndedMeeting,
    setMeetingId,
    setTeamId,
    setIceServers,
    isUploading,
    setHasActiveMeeting,
    setStartTime,
    hasActiveMeeting,
  } = useMeetingStore();

  const [isSyncing, setIsSyncing] = useState(false);

  const pathnameRef = useRef(pathname);
  const meetingRef = useRef(meeting);
  const isUploadingRef = useRef(isUploading);
  const activeMeetingTeamIdRef = useRef(activeMeetingTeamId);
  const meetingIdRef = useRef(meetingId);
  const lastHandledEndedMeetingIdRef = useRef('');

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  useEffect(() => {
    activeMeetingTeamIdRef.current = activeMeetingTeamId;
  }, [activeMeetingTeamId]);

  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  const myProfileIds = useMemo(() => getProfileIds(profile), [profile]);
  const myNames = useMemo(
    () =>
      [
        profile?.name,
        (profile as any)?.userName,
        (profile as any)?.nickName,
        (profile as any)?.nickname,
      ]
        .map(normalizeText)
        .filter(Boolean),
    [profile]
  );

  const myMemberInfo = useMemo(() => {
    return teamMembers?.find((member) => {
      const memberData = member as any;
      const memberIds = getMemberIds(member);

      if (memberIds.some((value) => myProfileIds.includes(value))) {
        return true;
      }

      const memberNames = [
        member?.name,
        memberData?.nickname,
        memberData?.nickName,
        memberData?.user?.name,
        memberData?.user?.nickname,
        memberData?.user?.nickName,
      ]
        .map(normalizeText)
        .filter(Boolean);

      return memberNames.some((name) => myNames.includes(name));
    });
  }, [myNames, myProfileIds, teamMembers]);

  const isLeader = useMemo(() => {
    const role = getMemberRole(myMemberInfo);

    return (
      role === 'LEADER' ||
      role === 'OWNER' ||
      role === 'ADMIN' ||
      role === 'MASTER' ||
      role === 'HOST' ||
      (!!currentTeamId && teamMembers.length === 1)
    );
  }, [currentTeamId, myMemberInfo, teamMembers.length]);

  const isMeetingInCurrentTeam = useMemo(() => {
    return Boolean(
      meeting && meetingId && activeMeetingTeamId && activeMeetingTeamId === currentTeamId
    );
  }, [activeMeetingTeamId, currentTeamId, meeting, meetingId]);

  const shouldPollActiveMeeting = useMemo(() => {
    return (
      pathname.includes('/meeting') ||
      isMeetingInCurrentTeam ||
      hasActiveMeeting
    );
  }, [hasActiveMeeting, isMeetingInCurrentTeam, pathname]);

  const finalizeMeetingEnded = useCallback(
    (endedMeetingId: string, endedTeamId: string) => {
      if (!endedMeetingId || !endedTeamId) {
        return;
      }

      if (lastHandledEndedMeetingIdRef.current === endedMeetingId) {
        return;
      }

      lastHandledEndedMeetingIdRef.current = endedMeetingId;
      setLastEndedMeeting(endedMeetingId, endedTeamId);
      setMeeting(false);
      setHasActiveMeeting(false);
      setMeetingId('');
      setTeamId('');
      setIceServers([]);
      setStartTime(null);
      meetingRef.current = false;
      window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));
      if (currentTeamId === endedTeamId) {
        alert('회의가 종료되었습니다.');
        router.push(`/main/${endedTeamId}`);
        return;
      }

      if (pathnameRef.current.includes('/meeting')) {
        alert('회의가 종료되었습니다.');
      }

      if (pathnameRef.current.includes('/meeting') && endedTeamId) {
        router.push(`/main/${endedTeamId}`);
      }
    },
    [
      currentTeamId,
      router,
      setHasActiveMeeting,
      setIceServers,
      setLastEndedMeeting,
      setMeeting,
      setMeetingId,
      setStartTime,
      setTeamId,
    ]
  );

  useEffect(() => {
    if (!pathname.includes('/meeting')) {
      return;
    }

    if (meeting || hasActiveMeeting || isUploading) {
      return;
    }

    if (meetingIdRef.current && activeMeetingTeamIdRef.current) {
      finalizeMeetingEnded(
        meetingIdRef.current,
        activeMeetingTeamIdRef.current
      );
    }
  }, [finalizeMeetingEnded, hasActiveMeeting, isUploading, meeting, pathname]);

  const checkActiveMeeting = useCallback(async () => {
    if (!currentTeamId || !profile) return;

    try {
      setIsSyncing(true);

      const activeMeeting = await getActiveMeetings(currentTeamId);
      const currentPath = pathnameRef.current;

      if (!activeMeeting || !activeMeeting.meetingId) {
        const previousMeetingId = meetingIdRef.current;
        const previousMeetingTeamId = activeMeetingTeamIdRef.current;

        setHasActiveMeeting(false);
        setStartTime(null);
        if (activeMeetingTeamIdRef.current === currentTeamId) {
          setIceServers([]);
        }

        if (
          previousMeetingId &&
          previousMeetingTeamId === currentTeamId
        ) {
          finalizeMeetingEnded(previousMeetingId, previousMeetingTeamId);
          return;
        }

        if (
          activeMeetingTeamIdRef.current === currentTeamId &&
          !currentPath.includes('/meeting')
        ) {
          setMeeting(false);
          setMeetingId('');
          setTeamId('');
          setIceServers([]);
        }
        return;
      }

      setHasActiveMeeting(true);

      const isParticipant =
        Array.isArray(activeMeeting.participants) &&
        activeMeeting.participants.some((participant: any) => {
          const participantIds = getMemberIds(participant);

          if (participantIds.some((value) => myProfileIds.includes(value))) {
            return true;
          }

          const participantNames = [
            participant?.name,
            participant?.nickname,
            participant?.nickName,
            participant?.user?.name,
            participant?.user?.nickname,
            participant?.user?.nickName,
          ]
            .map(normalizeText)
            .filter(Boolean);

          return participantNames.some((name) => myNames.includes(name));
        });

      if (isParticipant) {
        setMeeting(true);
        setMeetingId(activeMeeting.meetingId);
        setTeamId(currentTeamId);
        setIceServers(
          Array.isArray(activeMeeting.iceServers) ? activeMeeting.iceServers : []
        );
      } else if (
        activeMeetingTeamIdRef.current === currentTeamId &&
        !currentPath.includes('/meeting')
      ) {
        setMeeting(false);
        setMeetingId('');
        setTeamId('');
        setIceServers([]);
      }
    } catch (error) {
      console.log('Header: getActiveMeeting error', error);
      setHasActiveMeeting(false);
    } finally {
      setIsSyncing(false);
    }
  }, [
    currentTeamId,
    finalizeMeetingEnded,
    myNames,
    myProfileIds,
    profile,
    setHasActiveMeeting,
    setMeeting,
    setMeetingId,
    setIceServers,
    setStartTime,
    setTeamId,
  ]);

  useEffect(() => {
    void checkActiveMeeting();
  }, [checkActiveMeeting]);

  useEffect(() => {
    if (!currentTeamId || !shouldPollActiveMeeting) return;

    const intervalId = setInterval(() => {
      void checkActiveMeeting();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [checkActiveMeeting, currentTeamId, shouldPollActiveMeeting]);

  useEffect(() => {
    const handleSync = () => {
      void checkActiveMeeting();
    };

    window.addEventListener('meezy:sync-meeting', handleSync);
    return () => window.removeEventListener('meezy:sync-meeting', handleSync);
  }, [checkActiveMeeting]);

  const handleGlobalMeetingEvent = useCallback(
    (event: MeetingEvent) => {
      if (event.type === 'meeting-ended') {
        finalizeMeetingEnded(
          meetingIdRef.current,
          activeMeetingTeamIdRef.current || currentTeamId
        );
        return;
      }

      void checkActiveMeeting();
    },
    [
      checkActiveMeeting,
      currentTeamId,
      finalizeMeetingEnded,
    ]
  );

  useMeetingEvents(currentTeamId, handleGlobalMeetingEvent);

  useEffect(() => {
    const handleUnload = () => {
      const teamIdToLeave = activeMeetingTeamIdRef.current;
      if (meetingRef.current && teamIdToLeave && meetingIdRef.current) {
        leaveMeetingOnUnload(teamIdToLeave);
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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

    if (isMeetingInCurrentTeam) {
      try {
        setLoading(true);
        setLoadingState(MESSAGE_LEAVING_MEETING);

        if (meetingIdRef.current) {
          setLastEndedMeeting(meetingIdRef.current, currentTeamId);
        }
        await leaveMeeting(currentTeamId);

        setMeeting(false);
        setHasActiveMeeting(false);
        setMeetingId('');
        setTeamId('');
        setStartTime(null);
        meetingRef.current = false;

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
        alert(MESSAGE_LEAVE_FAILED);
        return;
      }
    }

    try {
      console.log('[DEBUG] Header: onClickMeeting starting. isLeader:', isLeader);
      const response = isLeader
        ? await startMeeting(currentTeamId)
        : await joinMeeting(currentTeamId);
      
      console.log('[DEBUG] Header: Meeting response received:', response);

      setMeeting(true);
      setHasActiveMeeting(true);
      setStartTime(null);
      setTeamId(currentTeamId);
      setIceServers(Array.isArray(response?.iceServers) ? response.iceServers : []);

      if (response?.meetingId) {
        setMeetingId(response.meetingId);
      }

      void checkActiveMeeting();
      window.dispatchEvent(new CustomEvent('meezy:sync-meeting'));
      router.push(`/main/${currentTeamId}/meeting`);
    } catch (error: any) {
      console.error(`${isLeader ? 'start' : 'join'}Meeting error:`, error);
      const errorMsg =
        error?.response?.data?.message || error?.message || MESSAGE_UNKNOWN_ERROR;

      alert(
        `${isLeader ? LABEL_START_MEETING : LABEL_JOIN_MEETING}\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: ${errorMsg}`
      );
    }
  };

  const meetingButtonLabel = isMeetingInCurrentTeam
    ? LABEL_LEAVE_MEETING
    : isLeader
    ? LABEL_START_MEETING
    : LABEL_JOIN_MEETING;

  return (
    <header
      className="w-full flex justify-between items-center p-6 border-l border-white/5"
      style={{
        ...typography.body.BodyM,
        backgroundColor: colors.black[100],
      }}
    >
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
        <h1
          className="text-[#ff5c00] font-extrabold text-2xl tracking-tight cursor-pointer"
          onClick={onClickMain}
        >
          Meezy.
        </h1>
      </div>

      <div className="flex items-center gap-10">
        {currentTeamId && (
          <button
            className="py-3 px-6 rounded-full cursor-pointer transition-opacity hover:opacity-80"
            style={{
              color: colors.white[100],
              backgroundColor: isMeetingInCurrentTeam
                ? colors.system.error[500]
                : isLeader || hasActiveMeeting
                ? colors.primary[500]
                : colors.gray[500],
              ...typography.body.BodyM,
            }}
            onClick={onClickMeeting}
          >
            {meetingButtonLabel}
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
