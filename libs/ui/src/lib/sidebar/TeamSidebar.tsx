'use client';

import { colors } from '../../design';
import Image from 'next/image';
import Plus from '../../assets/Plus.svg';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useServerState, useServerJoinedTeam, useProfile } from '../../context';
import { useTeamStore, getTeamMembers, expelTeamMember } from '@org/shop-data';

interface SidebarProps {
  onOpenModal?: () => void;
}

export function TeamSidebar({ onOpenModal }: SidebarProps) {
  const { setJoined } = useServerJoinedTeam();
  const [alarm, setAlarm] = useState(false);
  const router = useRouter();
  const { updateTeams } = useServerState();
  const { teams } = useTeamStore();
  const { profile } = useProfile();
  const [contextMenuTeamId, setContextMenuTeamId] = useState<string | null>(
    null
  );

  useEffect(() => {
    updateTeams();
  }, []);

  const handleTeamClick = (teamId: string) => {
    setJoined(true);
    router.push(`/main/${teamId}`);
  };

  const onContextMenu = (e: React.MouseEvent, teamId: string) => {
    e.preventDefault();
    setContextMenuTeamId(teamId);
  };

  const handleClickOutside = () => setContextMenuTeamId(null);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const onLeaveTeam = async (teamId: string) => {
    try {
      // 1. 해당 팀의 멤버 목록 가져오기
      const members = await getTeamMembers(teamId);

      // 2. 내 프로필 ID를 기반으로 내 teamMemberId 찾기
      const profileId =
        profile?.id ||
        profile?.userId ||
        (profile as any)?.user_id ||
        (profile as any)?.accountId;

      const myMember = members.find((m: any) => {
        const memberUserId =
          m.userId ||
          m.user_id ||
          m.user?.id ||
          m.user?.userId ||
          m.teamMemberId;
        return String(memberUserId) === String(profileId);
      });

      if (!myMember) {
        alert('팀 멤버 정보를 찾을 수 없습니다.');
        return;
      }

      // 3. 팀 나가기 (자신을 expel)
      if (confirm('정말로 팀을 나가시겠습니까?')) {
        await expelTeamMember(teamId, myMember.teamMemberId);
        alert('팀에서 나갔습니다.');
        await updateTeams();
        router.push('/main');
      }
    } catch (error) {
      console.error('팀 나가기 실패:', error);
      alert('팀 나가기에 실패했습니다.');
    } finally {
      setContextMenuTeamId(null);
    }
  };

  return (
    <nav
      className="w-[100px] max-w-[80px] h-screen flex flex-col items-center"
      style={{
        backgroundColor: colors.gray[900],
      }}
    >
      <div className="mt-12 flex flex-col items-center gap-4 flex-1 overflow-y-auto no-scrollbar w-full border-r border-[#262626]">
        <button
          className="min-w-14 min-h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors group"
          aria-label="팀 추가"
          onClick={onOpenModal}
        >
          <Image src={Plus} alt="plus" className="w-5" />
        </button>
        {teams?.map((team) => (
          <div
            key={team?.teamId}
            className="flex justify-center items-center mr-4"
          >
            <div
              className="h-2 rounded-full mr-4"
              style={{
                backgroundColor: alarm ? colors.primary[500] : 'transparent',
              }}
            />

            <button
              type="button"
              aria-label={team.teamName}
              className="relative w-14 h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors overflow-hidden"
              onClick={() => handleTeamClick(team.teamId)}
            >
              {team.serverImageUrl ? (
                <Image
                  src={team.serverImageUrl}
                  alt={team.teamName}
                  fill
                  className="object-cover"
                  unoptimized
                  onContextMenu={(e) => onContextMenu(e, team.teamId)}
                />
              ) : (
                <div
                  className="text-xs"
                  onContextMenu={(e) => onContextMenu(e, team.teamId)}
                >
                  {team.teamName}
                </div>
              )}
            </button>
            {contextMenuTeamId === team.teamId && (
              <div
                className="absolute left-20 z-50 px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: colors.gray[800],
                  color: colors.white[100],
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLeaveTeam(team.teamId);
                }}
              >
                팀 나가기
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
