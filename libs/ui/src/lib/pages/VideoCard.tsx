import Image from 'next/image';
import Kamera from '../../assets/Kamera.svg';
import Mike from '../../assets/mike.svg';
import NoMike from '../../assets/NoMike.svg';
import Nokamera from '../../assets/Nokamera.svg';
import WebRTC from './WebRTC';

type VideoCardProps = {
  name: string;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isMike: boolean;
  isKamera: boolean;
  videoStream?: MediaStream | null;
  onMikeClick: () => void;
  onKameraClick: () => void;
};

export const VideoCard = ({
  name,
  isLocal = false,
  isSpeaking,
  isMike,
  isKamera,
  videoStream,
  onMikeClick,
  onKameraClick,
}: VideoCardProps) => {
  const streamSignature = videoStream
    ? [
        ...videoStream.getVideoTracks().map((track) => `v:${track.id}`),
        ...videoStream.getAudioTracks().map((track) => `a:${track.id}`),
      ].join('|')
    : 'no-stream';

  return (
    <div
      className={`relative bg-[#1e1e1e] rounded-2xl flex flex-col items-center justify-center overflow-hidden w-full h-full min-h-0 transition-all border ${
        isSpeaking
          ? 'border-[#3b82f6] shadow-[0_0_18px_rgba(59,130,246,0.35)]'
          : 'border-white/5 shadow-lg'
      }`}
    >
      {videoStream && (
        <div
          className={`w-full h-full absolute inset-0 ${
            isKamera ? '' : 'opacity-0 pointer-events-none'
          }`}
        >
          <WebRTC
            key={`${isLocal ? 'local' : 'remote'}:${name}:${streamSignature}`}
            stream={videoStream}
            isLocal={isLocal}
          />
        </div>
      )}

      {(!videoStream || !isKamera) && (
        <>
          <div
            className={`w-[20%] aspect-square max-w-[100px] min-w-[60px] rounded-full bg-[#d9d9d9] transition-all duration-300 ${
              isSpeaking ? 'ring-4 ring-[#3b82f6]' : 'ring-0'
            }`}
          />
          <span className="mt-4 text-white font-bold text-base md:text-lg">
            {name}
          </span>
        </>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2 items-center bg-black/30 p-1.5 px-2 rounded-lg backdrop-blur-sm">
        <Image
          src={isMike ? Mike : NoMike}
          alt="Mike"
          width={14}
          height={14}
          className="opacity-70"
          onClick={onMikeClick}
        />
        <Image
          src={isKamera ? Kamera : Nokamera}
          alt="Nokamera"
          width={14}
          height={14}
          onClick={onKameraClick}
        />
      </div>
    </div>
  );
};
