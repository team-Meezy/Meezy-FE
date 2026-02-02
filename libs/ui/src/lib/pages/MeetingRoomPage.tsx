'use client';

import { VideoCard } from './VideoCard';
import { useState } from 'react';
import Image from 'next/image';
import Nokamera from '../../assets/Nokamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';

//최대 10명
const userList = [
  { id: 1, name: '손희찬', isSpeaking: true },
  { id: 2, name: '김효현', isSpeaking: false },
  { id: 3, name: '김효현', isSpeaking: false },
  { id: 4, name: '김효현', isSpeaking: false },
  { id: 5, name: '김효현', isSpeaking: false },
];

export const MeetingRoomPage = () => {
  const count = userList.length;
  const [isMike, setIsMike] = useState(true);
  const [isKamera, setIsKamera] = useState(false);

  const onMikeClick = () => {
    setIsMike(!isMike);
  };

  const onKameraClick = () => {
    setIsKamera(!isKamera);
  };

  const getGridCols = () => {
    if (count <= 2) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] p-4 md:py-6 md:px-12 no-scrollbar">
      <div className="flex-1 overflow-y-auto no-scrollbar mb-4 px-5 flex flex-col">
        <div
          className={`grid ${getGridCols()} gap-4 w-full max-w-5xl mx-auto my-auto content-center`}
        >
          {userList.map((user, index) => {
            const isFirstFull = count > 2 && count % 2 !== 0 && index === 0;

            return (
              <div
                key={user.id}
                className={`w-full h-full min-h-[250px] md:min-h-[220px] ${
                  isFirstFull ? 'col-span-2' : 'col-span-1'
                }`}
              >
                <VideoCard
                  name={user.name}
                  isSpeaking={user.isSpeaking}
                  isMike={isMike}
                  isKamera={isKamera}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="bg-[#1e1e1e] rounded-2xl py-3 px-6 flex items-center justify-center relative w-full max-w-5xl mx-auto shrink-0 border border-white/10">
        <button
          className="p-3 hover:bg-[#333] rounded-full transition-all group"
          onClick={onMikeClick}
        >
          <Image
            src={isMike ? Mike : NoMike}
            alt="Mike"
            width={22}
            height={22}
          />
        </button>
        <button
          className="p-3 hover:bg-[#333] rounded-full transition-all shadow-lg"
          onClick={onKameraClick}
        >
          <Image
            src={isKamera ? Kamera : Nokamera}
            alt="Nokamera"
            width={22}
            height={22}
          />
        </button>
        <button className="absolute right-8 text-white/40 hover:text-white">
          <span className="text-2xl font-extralight tracking-tighter cursor-pointer">
            ⛶
          </span>
        </button>
      </div>
    </div>
  );
};
