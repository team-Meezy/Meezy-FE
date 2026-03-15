'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';
import { useServerJoinedTeam } from '../../context';
import { useModalStore, useErrorStore } from '@org/shop-data';
import { useServerIdStore } from '@org/shop-data';
import { createInviteCode } from '@org/shop-data';
import { useServerState } from '../../context';
import { createChatRoom } from '@org/shop-data';
import { useChatStore } from '@org/shop-data';

interface JoinedModalProps {
  isOpen: boolean;
  type: 'ROOM' | 'MEMBER' | null;
  onClose: () => void;
}

export function JoinedModal({ isOpen, type, onClose }: JoinedModalProps) {
  const { mounted, setMounted, serverName, setServerName } = useModalStore();
  const { generalError, setGeneralError } = useErrorStore();
  const { setJoined } = useServerJoinedTeam();
  const { serverId } = useServerIdStore();
  const { inviteCode, setInviteCode, updateChatRooms } = useServerState();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (generalError) {
      const timer = setTimeout(() => {
        setGeneralError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [generalError]);

  useEffect(() => {
    if (isOpen && type === 'MEMBER' && serverId) {
      const createCode = async () => {
        try {
          const res = await createInviteCode(serverId);
          console.log(res, '초대 코드 생성 결과');
          if (res && res.inviteCode) {
            setInviteCode({
              inviteCode: res.inviteCode,
              expiresAt: res.expiresAt || '',
            });
            // remove setServerName(res.inviteCode); to avoid mixing with ROOM input
          }
        } catch (error) {
          console.error('초대 코드 생성 실패:', error);
        }
      };
      createCode();
    }
  }, [isOpen, type, serverId, setInviteCode]);

  const createServer = async () => {
    const valueToValidate = serverName;
    console.log(valueToValidate, '값');
    if (!valueToValidate) {
      setGeneralError('채널 이름을 입력해주세요.');
      return false;
    }

    try {
      await createChatRoom(serverId, valueToValidate);
      // 생성 성공 후, 중앙 집중화된 업데이트 함수 호출
      await updateChatRooms(serverId);
      console.log('Channels updated via centralized function after creation');
    } catch (e: any) {
      console.error('Channel creation failed:', e);
      if (e.response?.data?.message) {
        setGeneralError(e.response.data.message);
      }
    }

    setJoined(true);

    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(
    // 배경 Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      {/* 모달 컨테이너 */}
      <div className="w-[480px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 pt-4 flex flex-col gap-6">
          {/* 서버 이름 입력 */}
          <section>
            <h2
              className="text-white mb-3"
              style={{ ...typography.title.sTitleB }}
            >
              {type === 'ROOM' ? '채널 만들기' : '팀원 초대하기'}
            </h2>
            <p
              className="mb-4"
              style={{ ...typography.body.BodyM, color: colors.gray[300] }}
            >
              {type === 'ROOM'
                ? '채널을 만들어 다양한 소통을 즐겨보세요!'
                : '아래 링크를 공유하여 팀원을 초대하세요.'}
            </p>
            {generalError && type === 'ROOM' && (
              <div
                className="flex flex-col items-center justify-center w-[100%] p-4 rounded-lg mb-4"
                style={{
                  backgroundColor: '#fab1b1ff',
                  border: `1px solid ${'#ffa0a0ff'}`,
                }}
              >
                <p
                  style={{
                    ...typography.body.BodyM,
                    color: colors.system.error[500],
                  }}
                >
                  {generalError}
                </p>
              </div>
            )}

            <input
              type="text"
              value={type === 'MEMBER' ? inviteCode.inviteCode : serverName}
              onChange={(e) => {
                if (type === 'ROOM') setServerName(e.target.value);
              }}
              readOnly={type !== 'ROOM'}
              placeholder={
                type === 'ROOM' ? '채널 이름' : '초대 코드를 생성 중입니다...'
              }
              className="w-full border-none rounded-lg p-3 placeholder:text-gray-500 outline-none transition-all"
              style={{
                ...typography.body.BodyM,
                backgroundColor: colors.gray[700],
                color: colors.white[100],
              }}
            />
          </section>
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-6 py-4 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#ff5c00] text-[#ff5c00] rounded-lg font-bold hover:bg-[#ff5c00]/10 transition-colors"
            style={{ ...typography.body.BodyB }}
          >
            닫기
          </button>
          <button
            onClick={type === 'ROOM' ? createServer : onClose}
            className="flex-1 py-3 px-4 bg-[#ff5c00] text-white rounded-md font-bold hover:bg-[#e65300] transition-colors"
          >
            {type === 'ROOM' ? '추가' : '완료'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
