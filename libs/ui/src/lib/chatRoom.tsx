import { colors, typography } from '../design';
import Image from 'next/image';
import shrap from '../assets/shrap.svg';

interface ChatRoomProps {
  roomId: string | null;
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  return (
    <main
      className="flex-[3] border border-white/5 flex flex-col h-full"
      style={{ backgroundColor: colors.black[100] }}
    >
      {/* 방 이름 (고정) */}
      <div
        className="w-full flex items-center gap-3 px-4 py-5 shrink-0"
        style={{
          ...typography.body.BodyB,
          backgroundColor: colors.gray[800],
          color: colors.gray[400],
        }}
      >
        <Image src={shrap} alt="shrap" className="w-4" />
        <span>환영</span>
      </div>

      {/* 채팅 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 채팅 내용 */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ backgroundColor: colors.black[100] }}
        >
          {/* 메시지 리스트 */}
        </div>

        {/* 입력창 (고정) */}
        <div className="shrink-0 px-4 py-3">
          <input
            type="text"
            className="w-full h-14 rounded-lg px-4"
            placeholder="메시지를 입력하세요"
            style={{
              ...typography.body.BodyB,
              backgroundColor: colors.gray[800],
              color: colors.gray[400],
            }}
          />
        </div>
      </div>
    </main>
  );
}
