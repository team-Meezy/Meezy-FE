'use client';

import { useState } from 'react';
import { colors, typography } from '../design';
import Image from 'next/image';
import shrap from '../assets/shrap.svg';
import { useChatScroll } from '../hooks/useChatScroll';

interface Message {
  id: number;
  chatingRoomId: number | null;
  userName: string;
  time: string;
  content: string[];
}

interface ChatRoomProps {
  roomId: number | null;
  roomName: string | null;
}

export function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      chatingRoomId: 1,
      userName: '손희찬',
      time: '2025. 9. 30. 오후 2:30',
      content: ['hello, my name is hyohyun'],
    },
    {
      id: 2,
      chatingRoomId: 1,
      userName: '김효현',
      time: '2025. 9. 30. 오후 2:30',
      content: ['hello, my name is hyohyun'],
    },
  ]);
  const [input, setInput] = useState('');

  const roomMessages = messages.filter((msg) => msg.chatingRoomId === roomId);

  const { containerRef, handleScroll, scrollToBottom, showNewMessageNotice } =
    useChatScroll(roomMessages);

  const sendMessage = () => {
    if (input.trim() && roomId !== null) {
      const newMessage: Message = {
        id: Date.now(),
        chatingRoomId: roomId,
        userName: '나',
        time: new Date().toLocaleString(),
        content: [input],
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
    }
  };

  return (
    <main
      className="flex-[3] border border-white/5 flex flex-col h-full"
      style={{ backgroundColor: colors.black[100] }}
    >
      {/* 방 이름 */}
      <div
        className="w-full flex items-center gap-3 px-4 py-5 shrink-0"
        style={{
          ...typography.body.BodyB,
          backgroundColor: colors.gray[800],
          color: colors.gray[400],
        }}
      >
        <Image src={shrap} alt="shrap" className="w-4" />
        <span>{roomName}</span>
      </div>

      {/* 채팅 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar"
          style={{ backgroundColor: colors.black[100] }}
          onScroll={handleScroll}
        >
          {roomMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D9D9D9] shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ ...typography.body.BodyB, color: '#FFFFFF' }}>
                    {msg.userName}
                  </span>
                  <span
                    style={{
                      ...typography.label.labelB,
                      color: colors.gray[400],
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {msg.content.map((line, idx) => (
                    <p
                      key={idx}
                      style={{
                        ...typography.body.BodyM,
                        color: '#FFFFFF',
                        opacity: 0.9,
                      }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 새 메시지 알림 */}
        {showNewMessageNotice && (
          <div
            className="absolute bottom-20 left-1/3 translate-x-1/3 px-4 py-2 rounded-full text-white cursor-pointer"
            style={{
              backgroundColor: colors.primary[500],
              ...typography.body.BodyB,
            }}
            onClick={scrollToBottom}
          >
            새 메시지
          </div>
        )}

        {/* 입력창 */}
        <div className="shrink-0 px-4 py-3 bg-[#121212]">
          <div className="relative flex items-center">
            <input
              type="text"
              className="w-full h-14 rounded-lg px-4 pr-16 outline-none"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                ...typography.body.BodyB,
                backgroundColor: colors.gray[800],
                color: colors.gray[400],
              }}
            />
            <button
              onClick={sendMessage}
              className="absolute right-4 text-sm font-bold"
              style={{ color: colors.gray[400] }}
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
