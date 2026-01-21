'use client';

import { colors } from '../../design';
import Image from 'next/image';
import { Plus } from '../../assets/index.client';
import { useServerCreate } from '../../context';
import { useServerJoinedTeam } from '../../context';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  onOpenModal?: () => void;
  projectSidebarList?: {
    team_id: number;
    team_name: string;
    create_at: null;
    invite_link: string;
  }[];
}

export function TeamSidebar({ onOpenModal, projectSidebarList }: SidebarProps) {
  const { imageFile } = useServerCreate();
  const { setJoined } = useServerJoinedTeam();
  const [alarm, setAlarm] = useState(false);
  const router = useRouter();

  const handleTeamClick = (teamId: number) => {
    setJoined(true);
    router.push(`/main/${teamId}`);
  };

  return (
    <nav
      className="w-[100px] h-screen flex flex-col items-center"
      style={{
        backgroundColor: colors.gray[900],
      }}
    >
      <div className="mt-12 flex flex-col items-center gap-4 flex-1 overflow-y-auto no-scrollbar w-full">
        <button
          className="min-w-14 min-h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors group"
          aria-label="팀 추가"
          onClick={onOpenModal}
        >
          <Image src={Plus} alt="plus" className="w-5" />
        </button>
        {projectSidebarList?.map((team) => (
          <div
            key={team.team_id}
            className="flex justify-center items-center mr-4"
          >
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{
                backgroundColor: alarm ? colors.primary[500] : 'transparent',
              }}
            />

            <button
              type="button"
              key={team.team_id}
              aria-label={team.team_name}
              className="min-w-14 min-h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[`#262626`] hover:bg-[`#252525`] transition-colors"
              onClick={() => handleTeamClick(team.team_id)}
            >
              {!imageFile && <div>{team.team_name}</div>}
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
}
