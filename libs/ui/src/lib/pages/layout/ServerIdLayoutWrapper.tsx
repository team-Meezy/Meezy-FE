import {
  roomsrcList,
  sidebarList,
  useServerJoinedTeam,
  useServerState,
  useProfile, // 프로필 정보 확인을 위해 추가
} from '../../../context';
import { JoinedSidebar } from '../../sidebar';
import { CalendarMockup, Header } from '../../components';
import { ReceiveAiAssistant } from '../../components';
import { useEffect } from 'react';
import { useServerIdStore } from '@org/shop-data';
import { useParams, useRouter } from 'next/navigation';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    teamMembers,
    setChatRoom,
    setServerProfile,
    setTeamMembers,
    updateTeamMembers,
  } = useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();
  const { setServerId } = useServerIdStore();
  const { profile } = useProfile();
  const router = useRouter();
  const params = useParams();
  const currentServerId = params.serverId as string;

  useEffect(() => {
    if (!currentServerId) return;

    // 전역 스토어도 동기화
    setServerId(currentServerId);

    const fetchMembers = async () => {
      setTeamMembers([]);
      await updateTeamMembers(currentServerId);
    };

    fetchMembers();
  }, [currentServerId, setServerId, setTeamMembers, updateTeamMembers]);

  // 방출 감지 및 리다이렉트 로직
  useEffect(() => {
    if (!currentServerId || !profile || teamMembers.length === 0) return;

    const profileId = profile.id || (profile as any).user_id || profile.userId;

    const isMember = teamMembers.some((m) => {
      const memberUserId =
        (m as any).userId ||
        (m as any).user_id ||
        (m as any).user?.id ||
        m.teamMemberId;
      return profileId === memberUserId;
    });

    if (!isMember) {
      console.warn(
        'Current user is not a member of this server. Redirecting...'
      );
      alert('접근 권한이 없거나 서버에서 제외되었습니다.');
      router.push('/main');
    }
  }, [currentServerId, profile, teamMembers, router]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <JoinedSidebar
        setChatRoom={setChatRoom}
        setSelectedRoomId={setSelectedRoomId}
        setServerProfile={setServerProfile}
        sidebarList={sidebarList}
        roomsrcList={roomsrcList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {joined && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {children}
          {joined && (
            <aside className="max-w-[270px] bg-[#111111] border border-white/5 p-6 flex flex-col gap-10">
              <CalendarMockup />
              <ReceiveAiAssistant />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
