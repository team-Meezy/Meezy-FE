// import { Plus } from 'lucide-react';
import { colors } from '../design';
import Image from 'next/image';
import plus from '../assets/plus.svg';

interface SidebarProps {
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export function Sidebar({ onOpenModal, onCloseModal }: SidebarProps) {
  return (
    <nav
      className="w-[72px] h-screen flex flex-col items-center"
      style={{
        backgroundColor: colors.gray[900],
      }}
    >
      <button
        className="w-12 h-12 mt-12 flex items-center justify-center rounded-lg border border-gray-800 bg-[#262626] hover:bg-[#252525] transition-colors group"
        aria-label="팀 추가"
        onClick={onOpenModal}
      >
        <Image src={plus} alt="plus" className="w-5" />
      </button>
    </nav>
  );
}
