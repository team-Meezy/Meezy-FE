'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { colors, typography } from '../../design';
import { Shrap } from '../../assets/index.client';
import { useChatScroll } from '../../hooks';
import {
  deleteChatRoom,
  getChatMessages,
  updateChatRoomName,
  useChatSocket,
  useChatStore,
  useMeetingChatActivity,
  useMeetingStore,
} from '@org/shop-data';
import { DeleteRoomModal, RenameRoomModal } from '../modals';
import { useProfile, useServerState } from '../../context';

type IdValue = string | number | null | undefined;

type ProfileLike = {
  id?: IdValue;
  userId?: IdValue;
  user_id?: IdValue;
  accountId?: IdValue;
  name?: string;
  userName?: string;
  nickName?: string;
  profileImage?: string;
  profileImageUrl?: string;
};

type TeamMemberLike = {
  teamMemberId?: IdValue;
  userId?: IdValue;
  user_id?: IdValue;
  name?: string;
  role?: string;
  profileImage?: string;
  profileImageUrl?: string;
  profile_image?: string;
  user_name?: string;
  user?: ProfileLike & {
    image?: string;
    profile_image?: string;
  };
};

function normalizeText(value?: string | null) {
  return String(value ?? '').trim();
}

function getProfileId(profile?: ProfileLike | null) {
  return profile?.id || profile?.userId || profile?.user_id || profile?.accountId;
}

function getMemberUserId(member?: TeamMemberLike | null) {
  return (
    member?.userId ||
    member?.user_id ||
    member?.user?.id ||
    member?.user?.userId ||
    member?.teamMemberId
  );
}

function resolveMemberImage(member?: TeamMemberLike | null) {
  return (
    member?.profileImage ||
    member?.profileImageUrl ||
    member?.user?.profileImage ||
    member?.user?.profileImageUrl ||
    member?.user?.image ||
    member?.profile_image ||
    member?.user?.profile_image ||
    ''
  );
}

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
  const members = teamMembers as TeamMemberLike[];

  const currentTeamId = String(params.serverId ?? '');
  const currentRoomId = String(params.chatRoomId ?? '');
  const { meetingId } = useMeetingStore();
  const profileId = getProfileId(profile);
  const myId = profileId ? String(profileId) : '';

  const { sendMessage: emitChatMessage } = useChatSocket(
    currentTeamId,
    currentRoomId,
    { receiveMessages: false }
  );
  const { sendChatActivity } = useMeetingChatActivity(meetingId, myId);

  const myMemberInfo = useMemo(() => {
    return members.find((member) => {
      const memberUserId = getMemberUserId(member);

      if (profileId && memberUserId && String(profileId) === String(memberUserId)) {
        return true;
      }

      return (
        member.name === profile?.name ||
        member.name === profile?.userName ||
        member.name === profile?.nickName
      );
    });
  }, [members, profile, profileId]);

  const isLeader = myMemberInfo?.role === 'LEADER';
  const currentRoom = chatRooms.find(
    (room) => room.chatRoomId === currentRoomId
  );
  const roomName = currentRoom?.name || '채널';

  const { containerRef, handleScroll, scrollToBottom, showNewMessageNotice } =
    useChatScroll(messages);

  useEffect(() => {
    if (!currentTeamId || !currentRoomId) return;

    const loadChatMessages = async () => {
      try {
        const res = await getChatMessages(currentTeamId, currentRoomId);
        setMessages(res);
      } catch (error) {
        console.error('[ChatRoomPage] 채팅 메시지 로드 실패:', error);
      }
    };

    const loadTeamMembers = async () => {
      try {
        await updateTeamMembers(currentTeamId);
      } catch (error) {
        console.error('[ChatRoomPage] 팀 멤버 로드 실패:', error);
      }
    };

    const loadChatRooms = async () => {
      try {
        await updateChatRooms(currentTeamId);
      } catch (error) {
        console.error('Chat room list load failed:', error);
      }
    };

    void loadChatMessages();
    void loadChatRooms();
    void loadTeamMembers();
  }, [
    currentTeamId,
    currentRoomId,
    setMessages,
    updateChatRooms,
    updateTeamMembers,
  ]);

  const sendMessage = () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || !currentRoomId) {
      return;
    }

    const isSent = emitChatMessage(trimmedInput);
    if (!isSent) return;

    addMessage({
      chatMessageId: `temp-${Date.now()}`,
      chatRoomId: currentRoomId,
      senderName:
        profile?.name || profile?.userName || profile?.nickName || 'Me',
      profileImage: profile?.profileImage || profile?.profileImageUrl,
      senderProfileImageUrl:
        profile?.profileImageUrl || profile?.profileImage,
      content: trimmedInput,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    });

    if (meetingId) {
      sendChatActivity();
    }

    setInput('');
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteChatRoom(currentTeamId, currentRoomId);
      const freshRooms = await updateChatRooms(currentTeamId);
      setIsDeleteModalOpen(false);

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

            return (
              <div
                key={msg.chatMessageId}
                className={`flex gap-3 w-full ${
                  isMyMessage ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {(() => {
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

                  const member = members.find((candidate) => {
                    const memberName = normalizeText(
                      candidate.name ||
                        candidate.user?.name ||
                        candidate.user?.userName ||
                        candidate.user?.nickName ||
                        candidate.user_name
                    );
                    const senderName = normalizeText(msg.senderName);

                    return (
                      memberName === senderName ||
                      Boolean(
                        memberName &&
                          senderName &&
                          (memberName.includes(senderName) ||
                            senderName.includes(memberName))
                      )
                    );
                  });

                  const memberImg = resolveMemberImage(member);
                  if (memberImg) {
                    return (
                      <img
                        src={memberImg}
                        alt={msg.senderName}
                        className="w-10 h-10 rounded-full shrink-0 object-cover"
                      />
                    );
                  }

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
