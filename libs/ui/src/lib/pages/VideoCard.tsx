import Image from 'next/image';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Kamera from '../../assets/Kamera.svg';
import Nokamera from '../../assets/Nokamera.svg';
import WebRTC from './WebRTC';

export const VideoCard = ({
  name,
  isSpeaking,
  isMike,
  isKamera,
  videoRef,
  onMikeClick,
  onKameraClick,
}: {
  name: string;
  isSpeaking?: boolean;
  isMike: boolean;
  isKamera: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onMikeClick: () => void;
  onKameraClick: () => void;
}) => {
  return (
    <div className="relative bg-[#1e1e1e] rounded-2xl flex flex-col items-center justify-center overflow-hidden w-full h-full min-h-0 transition-all border border-white/5 shadow-lg">
      {/* Video Area */}
      {videoRef && (
        <div
          className={`w-full h-full absolute inset-0 ${
            isKamera ? '' : 'hidden'
          }`}
        >
          <WebRTC videoRef={videoRef} />
        </div>
      )}

      {/* Placeholder (Avatar) Area */}
      {(!videoRef || !isKamera) && (
        <>
          <div
            className={`w-[20%] aspect-square max-w-[100px] min-w-[60px] rounded-full bg-[#d9d9d9] transition-all duration-300 ${
              isSpeaking ? 'ring-4 ring-[#4ade80]' : 'ring-0'
            }`}
          />
          <span className="mt-4 text-white font-bold text-base md:text-lg">
            {name}
          </span>
        </>
      )}
      <div className="absolute bottom-4 left-4 flex gap-2 items-center bg-black/30 p-1.5 px-2 rounded-lg backdrop-blur-sm">
        <Image
          src={videoRef && isMike ? Mike : NoMike}
          alt="Mike"
          width={14}
          height={14}
          className="opacity-70"
          onClick={onMikeClick}
        />
        <Image
          src={videoRef && isKamera ? Kamera : Nokamera}
          alt="Nokamera"
          width={14}
          onClick={onKameraClick}
          height={14}
        />
      </div>
    </div>
  );
};
