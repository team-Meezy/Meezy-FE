'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../../design';
import Image from 'next/image';
import { Shrap } from '../../assets/index.client';
import { useChatScroll } from '../../hooks';
import {
  getChatMessages,
  useChatStore,
  Message,
  deleteChatRoom,
  getChatRooms,
  updateChatRoomName,
  useChatSocket,
  useMeetingChatActivity,
  useMeetingStore,
} from '@org/shop-data';
import { useParams, useRouter } from 'next/navigation';
import { DeleteRoomModal, RenameRoomModal } from '../modals';
import { useProfile, useServerState } from '../../context';

export function ChatRoomPage() {
  const [input, setInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const { messages, setMessages, addMessage, chatRooms } = useChatStore();
  const params = useParams();
  const router = useRouter();
  const { profile } = useProfile();
  const { teamMembers, updateChatRooms, updateTeamMembers } =
    useServerState();

  // URL에서 teamId 및 chatRoomId 가져오기
  const currentTeamId = params.serverId as string;
  const currentRoomId = params.chatRoomId as string;

  // 채팅 웹소켓 연결
  const { sendMessage: emitChatMessage } = useChatSocket(
    currentTeamId,
    currentRoomId
  );

  // 회의 참여 기록 웹소켓 (회의 중일 때만 작동하도록 함)
  const { meetingId } = useMeetingStore();
  const myId =
    profile?.userId || profile?.id || profile?.user_id || profile?.accountId;
  const { sendChatActivity } = useMeetingChatActivity(meetingId, myId || '');

  // 현재 로그인한 유저가 리더인지 확인
  const myMemberInfo = teamMembers?.find((m) => {
    const profileId =
      profile?.id ||
      profile?.userId ||
      profile?.user_id ||
      (profile as any)?.accountId;
    const memberUserId =
      (m as any).userId ||
      (m as any).user_id ||
      (m as any).user?.id ||
      (m as any).user?.userId ||
      m.teamMemberId;

    if (profileId && memberUserId && String(profileId) === String(memberUserId))
      return true;
    if (
      m.name === profile?.name ||
      m.name === profile?.userName ||
      m.name === profile?.nickName
    )
      return true;
    return false;
  });

  const isLeader = myMemberInfo?.role === 'LEADER';

  // 현재 방 이름 찾기
  const currentRoom = chatRooms.find(
    (room) => room.chatRoomId === currentRoomId
  );
  const roomName = currentRoom?.name || '채널';

  const { containerRef, handleScroll, scrollToBottom, showNewMessageNotice } =
    useChatScroll(messages);

  useEffect(() => {
    if (!currentTeamId || !currentRoomId) return;

    const apiChatMessages = async () => {
      try {
        const res = await getChatMessages(currentTeamId, currentRoomId);
        console.log('📩 [ChatRoomPage] Loaded Messages:', res);
        setMessages(res);
      } catch (error) {
        console.error('❌ [ChatRoomPage] 채팅 메시지 로드 실패:', error);
      }
    };

    const apiTeamMembers = async () => {
      try {
        await updateTeamMembers(currentTeamId);
      } catch (error) {
        console.error('❌ [ChatRoomPage] 팀 멤버 로드 실패:', error);
      }
    };

    apiChatMessages();
    apiTeamMembers();
  }, [currentTeamId, currentRoomId, setMessages, updateTeamMembers]);

  // 팀 멤버 데이터 변경 시 로그 출력
  useEffect(() => {
    console.log('👥 [ChatRoomPage] Current Team Members:', teamMembers);
  }, [teamMembers]);

  const sendMessage = () => {
    if (input.trim() && currentRoomId) {
      // 1. 실제 채팅 메시지 발송
      emitChatMessage(input.trim());

      // 2. 회의 중이라면 채팅 활동 기록 신호 발송
      if (meetingId) {
        sendChatActivity();
      }

      // 3. (옵션) 내 메시지는 즉시 화면에 표시하거나 소켓 수신을 기다림
      // 여기서는 소켓 수신 시 addMessage가 호출되므로 setInput만 비움
      setInput('');
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteChatRoom(currentTeamId, currentRoomId);
      // 삭제 후 중앙 집중화된 업데이트 함수 호출
      const freshRooms = await updateChatRooms(currentTeamId);
      setIsDeleteModalOpen(false);
      // 삭제 후 첫 번째 방으로 이동하거나 메인으로 이동
      if (freshRooms && freshRooms.length > 0) {
        router.push(`/main/${currentTeamId}/${freshRooms[0].chatRoomId}`);
      } else {
        router.push(`/main/${currentTeamId}`);
      }
    } catch (error) {
      console.error('채널 삭제 실패:', error);
      alert('채널 삭제에 실패했습니다.');
    }
  };

  const handleRenameRoom = async (newName: string) => {
    try {
      await updateChatRoomName(currentTeamId, currentRoomId, newName);
      // 목록 갱신
      await updateChatRooms(currentTeamId);
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error('채널 이름 변경 실패:', error);
      alert('채널 이름 변경에 실패했습니다.');
    }
  };

  return (
    <main
      className="flex-[3] border-l border-white/5 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: colors.black[100] }}
    >
      {/* 방 이름 */}
      <div
        className="w-full flex items-center justify-between px-4 py-5 shrink-0"
        style={{
          ...typography.body.BodyB,
          backgroundColor: colors.gray[800],
          color: colors.gray[400],
        }}
      >
        <div className="flex items-center gap-3">
          <Image src={Shrap} alt="shrap" className="w-4" />
          <span className="text-white">{roomName}</span>
        </div>
        {isLeader && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRenameModalOpen(true)}
              className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: colors.gray[400] }}
            >
              변경
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: colors.system.error[500] }}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 채팅 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar"
          style={{ backgroundColor: colors.black[100] }}
          onScroll={handleScroll}
        >
          {messages.map((msg) => {
            const isMyMessage =
              msg.senderName === profile?.name ||
              msg.senderName === profile?.userName ||
              msg.senderName === profile?.nickName;

            // 로깅: 특정 조건에서만 출력 (너무 많으면 브라우저 느려짐)
            if (!isMyMessage && messages.indexOf(msg) === 0) {
              console.log('🔍 [ChatRoomPage] Debugging first other message:', {
                msg,
                teamMembers,
              });
            }

            return (
              <div
                key={msg.chatMessageId}
                className={`flex gap-3 w-full ${
                  isMyMessage ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* 프로필 이미지: 메시지 직접 데이터 -> 내 프로필 -> 팀 멤버 리스트 매칭 순서 */}
                {(() => {
                  // 1. 메시지 객체 자체에 이미지가 있는 경우 최우선
                  const msgImg =
                    msg.profileImage ||
                    msg.senderProfileImageUrl ||
                    msg.senderImage;
                  if (msgImg) {
                    return (
                      <img
                        src={msgImg}
                        alt={msg.senderName}
                        className="w-10 h-10 rounded-full shrink-0 object-cover"
                      />
                    );
                  }

                  // 2. 내 메시지인 경우 내 프로필 정보 사용
                  if (isMyMessage) {
                    const myImg = profile?.profileImage || profile?.profileImageUrl;
                    if (myImg) {
                      return (
                        <img
                          src={myImg}
                          alt="my-profile"
                          className="w-10 h-10 rounded-full shrink-0 object-cover"
                        />
                      );
                    }
                  }

                  // 3. 팀 멤버 리스트에서 찾아보기
                  const member = teamMembers.find((m) => {
                    const mName = (
                      m.name ||
                      (m as any).user?.name ||
                      (m as any).user?.userName ||
                      (m as any).user?.nickName ||
                      (m as any).user_name ||
                      ''
                    ).trim();
                    const sName = (msg.senderName || '').trim();
                    const isMatched =
                      mName === sName ||
                      (mName && sName && (mName.includes(sName) || sName.includes(mName)));

                    return isMatched;
                  });

                  // 멤버의 이미지 필드 탐색 (가장 많이 발견되는 필드 순서)
                  const memberImg =
                    member?.profileImage ||
                    member?.profileImageUrl ||
                    (member as any).user?.profileImage ||
                    (member as any).user?.profileImageUrl ||
                    (member as any).user?.image ||
                    (member as any).profile_image ||
                    (member as any).user?.profile_image;

                  if (!memberImg && member && !isMyMessage) {
                    console.warn(`⚠️ [ChatRoomPage] Member found but NO image: ${msg.senderName}`, {
                      member,
                    });
                  }

                  if (memberImg) {
                    return (
                      <img
                        src={memberImg}
                        alt={msg.senderName}
                        className="w-10 h-10 rounded-full shrink-0 object-cover"
                      />
                    );
                  }

                  // 4. 모두 없으면 이름 첫 글자 표시
                  return (
                    <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0 flex items-center justify-center text-xs text-gray-600 font-bold">
                      {msg.senderName?.[0]?.toUpperCase() || '?'}
                    </div>
                  );
                })()}

                <div
                  className={`flex flex-col gap-1.5 max-w-[70%] ${
                    isMyMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      isMyMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <span
                      style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
                    >
                      {msg.senderName}
                    </span>
                    <span
                      style={{
                        ...typography.label.labelB,
                        color: colors.gray[400],
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className="px-4 py-2 rounded-2xl"
                    style={{
                      backgroundColor: isMyMessage
                        ? colors.primary[500]
                        : colors.gray[800],
                      borderTopRightRadius: isMyMessage ? '4px' : '16px',
                      borderTopLeftRadius: isMyMessage ? '16px' : '4px',
                    }}
                  >
                    <p
                      style={{
                        ...typography.body.BodyM,
                        color: isMyMessage ? '#FFFFFF' : '#E0E0E0',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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

        <div className="shrink-0 px-4 py-4 bg-[#121212]">
          <div className="relative flex items-center">
            <textarea
              className="w-full min-h-[48px] max-h-32 rounded-lg pl-4 pr-16 py-3 outline-none transition-all focus:ring-1 focus:ring-white/20 resize-none no-scrollbar"
              placeholder={`# ${roomName}에 메시지 보내기`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[800],
                color: colors.white[100],
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-4 bottom-6 text-sm font-bold transition-opacity hover:opacity-80 active:opacity-60 disabled:opacity-30"
              style={{ color: colors.primary[500] }}
            >
              전송
            </button>
          </div>
        </div>
      </div>

      <DeleteRoomModal
        isOpen={isDeleteModalOpen}
        roomName={roomName}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteRoom}
      />
      <RenameRoomModal
        isOpen={isRenameModalOpen}
        currentName={roomName}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRenameRoom}
      />
    </main>
  );
}
