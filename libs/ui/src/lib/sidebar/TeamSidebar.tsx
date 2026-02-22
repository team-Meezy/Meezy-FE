'use client';

import { colors } from '../../design';
import Image from 'next/image';
import Plus from '../../assets/Plus.svg';
import { useServerCreate } from '../../context';
import { useServerJoinedTeam } from '../../context';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTeams } from '@org/shop-data';
import { useEffect } from 'react';

interface Team {
  teamId: string;
  teamName: string;
  serverImageUrl: string | null;
}

interface SidebarProps {
  onOpenModal?: () => void;
}

export function TeamSidebar({ onOpenModal }: SidebarProps) {
  const { imageFile } = useServerCreate();
  const { setJoined } = useServerJoinedTeam();
  const [alarm, setAlarm] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getTeamsData = async () => {
      const data = await useGetTeams();
      setTeams(data);
    };
    getTeamsData();
  }, []);

  const handleTeamClick = (teamId: string) => {
    setJoined(true);
    router.push(`/main/${teamId}`);
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
              className="min-w-14 min-h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors overflow-hidden"
              onClick={() => handleTeamClick(team.teamId)}
            >
              {team.serverImageUrl ? (
                <Image
                  src={team.serverImageUrl}
                  alt={team.teamName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs">{team.teamName}</div>
              )}
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
}
