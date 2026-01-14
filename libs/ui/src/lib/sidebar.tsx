// import { Plus } from 'lucide-react';
import { colors } from "../design";

export function Sidebar() {
  return (
    <nav className="w-[72px] h-screen flex flex-col items-center p-6"
    style={{
      backgroundColor: colors.gray[900],
    }}>
      <button
        className="w-12 h-12 mt-12 flex items-center justify-center rounded-lg border border-gray-800 bg-gray-800 hover:bg-[#252525] transition-colors group"
        aria-label="팀 추가"
      >
        {/* <Plus className="text-gray-400 group-hover:text-white" size={24} /> */}
      </button>
    </nav>
  );
}
