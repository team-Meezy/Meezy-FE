'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../../design';
import Image from 'next/image';
import { Shrap } from '../../assets/index.client';
import { useChatScroll } from '../../hooks';
import { getChatMessages, useChatStore, Message } from '@org/shop-data';
import { useParams } from 'next/navigation';

export function ChatRoomPage() {
  const [input, setInput] = useState('');
  const { messages, setMessages, addMessage, chatRooms } = useChatStore();
  const params = useParams();

  // URL에서 teamId 및 chatRoomId 가져오기
  const currentTeamId = params.serverId as string;
  const currentRoomId = params.chatRoomId as string;
  console.log(currentRoomId, 'currentRoomId');

  // 현재 방 이름 찾기
  const currentRoom = chatRooms.find(
    (room) => room.room_id === Number(currentRoomId)
  );
  const roomName = currentRoom?.name || '채널';

  const { containerRef, handleScroll, scrollToBottom, showNewMessageNotice } =
    useChatScroll(messages);

  useEffect(() => {
    if (!currentTeamId || !currentRoomId) return;

    const apiChatMessages = async () => {
      try {
        const res = await getChatMessages(currentTeamId, currentRoomId);
        setMessages(res);
      } catch (error) {
        console.error('채팅 메시지 로드 실패:', error);
      }
    };
    apiChatMessages();
  }, [currentTeamId, currentRoomId, setMessages]);

  const sendMessage = () => {
    if (input.trim() && currentRoomId) {
      const newMessage: Message = {
        id: Date.now(),
        chatRoomId: Number(currentRoomId),
        userName: '나',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        content: [input.trim()],
      };
      addMessage(newMessage);
      setInput('');
    }
  };

  return (
    <main
      className="flex-[3] border-l border-white/5 flex flex-col h-full overflow-hidden"
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
        <Image src={Shrap} alt="shrap" className="w-4" />
        <span className="text-white">{roomName}</span>
      </div>

      {/* 채팅 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar"
          style={{ backgroundColor: colors.black[100] }}
          onScroll={handleScroll}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
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
                      key={`${msg.id}-line-${idx}`}
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
            className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.primary[500],
              ...typography.body.BodyB,
              zIndex: 10,
            }}
            onClick={scrollToBottom}
          >
            새 메시지 보기
          </div>
        )}

        {/* 입력창 */}
        <div className="shrink-0 px-4 py-4 bg-[#121212]">
          <div className="relative flex items-center">
            <input
              type="text"
              className="w-full h-12 rounded-lg pl-4 pr-16 outline-none transition-all focus:ring-1 focus:ring-white/20"
              placeholder={`# ${roomName}에 메시지 보내기`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[800],
                color: colors.white[100],
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-4 text-sm font-bold transition-opacity hover:opacity-80 active:opacity-60 disabled:opacity-30"
              style={{ color: colors.primary[500] }}
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
