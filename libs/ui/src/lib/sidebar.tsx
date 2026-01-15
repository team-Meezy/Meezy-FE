'use client';

// import { Plus } from 'lucide-react';
import { colors } from '../design';
import Image from 'next/image';
import plus from '../assets/plus.svg';
import { useServerCreate } from '../context/ServerCreateProvider';

interface SidebarProps {
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export function Sidebar({ onOpenModal, onCloseModal }: SidebarProps) {
  const { imageFile } = useServerCreate();

  const sidebarList = [
    {
      team_id: 1,
      team_name: 'BLIP',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 2,
      team_name: 'BLIP2',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 3,
      team_name: 'BLIP3',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 4,
      team_name: 'BLIP4',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 5,
      team_name: 'BLIP5',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 6,
      team_name: 'BLIP6',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 7,
      team_name: 'BLIP7',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 8,
      team_name: 'BLIP8',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 9,
      team_name: 'BLIP9',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
    {
      team_id: 10,
      team_name: 'BLIP10',
      create_at: null,
      invite_link: 'kgrkmewfkmdmklssalkd',
    },
  ];

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
          <Image src={plus} alt="plus" className="w-5" />
        </button>
        {sidebarList.map((team) => (
          <div
            key={team.team_id}
            className="min-w-14 min-h-14 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors"
          >
            {!imageFile && <div>{team.team_name}</div>}
          </div>
        ))}
      </div>
    </nav>
  );
}
