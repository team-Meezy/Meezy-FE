'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { colors, typography } from '../../design';
import { useImg } from '../../hooks';
import {
  useServerJoinedTeam,
  useServerCreate,
  useServerState,
} from '../../context';
import { useModalStore, useErrorStore } from '@org/shop-data';
import { createTeam, joinTeamByCode, getTeams } from '@org/shop-data';
import { useServerIdStore } from '@org/shop-data';

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function extractTeamId(payload: any, fallbackName?: string) {
  const directId =
    (typeof payload === 'number' && payload !== 0) ||
    (typeof payload === 'string' && payload !== '')
      ? payload
      : payload?.teamId ||
        payload?.team_id ||
        payload?.id ||
        payload?.data?.teamId ||
        payload?.data?.team_id ||
        payload?.data?.id ||
        (Array.isArray(payload) &&
          (payload[0]?.teamId || payload[0]?.team_id || payload[0]?.id));

  if (directId) {
    return String(directId);
  }

  return null;
}

export function ServerModal({ isOpen, onClose }: ServerModalProps) {
  const {
    serverName,
    setServerName,
    serverLink,
    setServerLink,
    createModal,
    setCreateModal,
  } = useModalStore();
  const { generalError, setGeneralError } = useErrorStore();
  const {
    localImageFile,
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
  } = useImg();
  const { setImageFile } = useServerCreate();
  const { setJoined } = useServerJoinedTeam();
  const { updateTeams } = useServerState();
  const { serverId, setServerId } = useServerIdStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setImageFile(localImageFile);
  }, [localImageFile, setImageFile]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [setMounted]);

  useEffect(() => {
    if (!generalError) return;

    const timer = setTimeout(() => {
      setGeneralError('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [generalError, setGeneralError]);

  const moveToTeam = (id?: string) => {
    router.push(`/main/${id || serverId}`);
  };

  const resolveFallbackTeamId = async (targetName?: string) => {
    const teams = await getTeams();
    if (!Array.isArray(teams) || teams.length === 0) return null;

    if (targetName) {
      const found = teams.find(
        (team: any) => team.teamName === targetName || team.name === targetName
      );
      if (found) {
        return String(found.teamId || found.team_id || found.id);
      }
    }

    return String(teams[0].teamId || teams[0].team_id || teams[0].id);
  };

  const handleCreateOrJoin = async () => {
    if (isSubmitting) return;

    const valueToValidate = createModal ? serverName.trim() : serverLink.trim();
    if (!valueToValidate) {
      setGeneralError(createModal ? '서버 이름을 입력해주세요.' : '링크를 입력해주세요.');
      return;
    }

    if (createModal && !localImageFile) {
      setGeneralError('서버 대표 이미지를 업로드해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (createModal) {
        const response = await createTeam(serverName.trim(), localImageFile as File);
        let newTeamId = extractTeamId(response, serverName.trim());

        if (!newTeamId) {
          newTeamId = await resolveFallbackTeamId(serverName.trim());
        }

        if (!newTeamId) {
          setGeneralError('생성된 팀 정보를 찾을 수 없습니다.');
          return;
        }

        await updateTeams();
        setServerId(newTeamId);
        setJoined(true);
        onClose();
        moveToTeam(newTeamId);
        return;
      }

      const inviteCode = serverLink.trim().split('/').pop() || serverLink.trim();
      const response = await joinTeamByCode(inviteCode);
      let newTeamId = extractTeamId(response);

      if (!newTeamId) {
        newTeamId = await resolveFallbackTeamId();
      }

      if (!newTeamId) {
        setGeneralError('참가한 팀 정보를 찾을 수 없습니다.');
        return;
      }

      await updateTeams();
      setServerId(newTeamId);
      setJoined(true);
      onClose();
      moveToTeam(newTeamId);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (createModal ? '팀 생성에 실패했습니다.' : '팀 참가에 실패했습니다.');
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="relative w-[480px] overflow-hidden rounded-xl border border-white/5 bg-[#2b2d31] shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModal(true)}
              style={{ ...typography.body.BodyM }}
              className={`p-3 text-[#A1A1AA] ${
                createModal ? 'rounded-xl bg-[#404040] text-[#fff]' : ''
              }`}
            >
              서버 만들기
            </button>
            <button
              onClick={() => setCreateModal(false)}
              style={{ ...typography.body.BodyM }}
              className={`rounded-xl p-3 text-[#A1A1AA] ${
                createModal ? '' : 'bg-[#404040] text-[#fff]'
              }`}
            >
              서버 참가하기
            </button>
          </div>
        </div>

        <div className="mt-3 flex h-[1px] w-full items-center justify-center">
          <div
            className="h-[1px] w-[94%] rounded-full bg-white"
            style={{ backgroundColor: colors.gray[700] }}
          />
        </div>

        <div className="flex flex-col gap-6 p-6 pt-4">
          <section>
            <h2 className="mb-1 text-xl font-bold text-white">
              {createModal ? '서버 만들기' : '서버 참가하기'}
            </h2>
            <p className="mb-4 text-xs text-gray-400">
              {createModal
                ? '회의를 위한 서버를 만들어보세요.'
                : '초대 링크를 입력해 서버에 참가해주세요.'}
            </p>

            {generalError && (
              <div
                className="mb-4 flex w-full flex-col items-center justify-center rounded-lg p-4"
                style={{
                  backgroundColor: '#fab1b1ff',
                  border: '1px solid #ffa0a0ff',
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

            <label className="mb-2 block text-xs font-bold uppercase text-gray-300">
              {createModal ? '이름' : '링크 입력'}
            </label>
            <input
              type="text"
              value={createModal ? serverName : serverLink}
              onChange={(e) => {
                if (createModal) {
                  setServerName(e.target.value);
                } else {
                  setServerLink(e.target.value);
                }
              }}
              placeholder={createModal ? '서버 이름' : '초대 링크를 입력'}
              className="w-full rounded-md border-none bg-[#1e1f22] p-3 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-1 focus:ring-orange-500"
            />
          </section>

          {createModal && (
            <section className="border-t border-white/5 pt-3">
              <h2 className="mb-1 text-xl font-bold text-white">
                서버 대표 이미지 지정
              </h2>
              <p className="mb-4 text-xs text-gray-400">
                서버 대표 이미지를 선택해주세요.
                <br />
                최소 512 x 512 크기를 권장합니다.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {previewUrl && (
                <div className="mb-4 flex flex-col items-start">
                  <img
                    src={previewUrl}
                    alt="서버 대표 이미지 미리보기"
                    className="h-32 w-42 rounded-lg border border-white/10 object-cover"
                  />
                </div>
              )}

              <button
                className="rounded-md bg-[#ff5c00] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#e65300]"
                onClick={handleClickUpload}
                disabled={isSubmitting}
              >
                {previewUrl ? '이미지 변경' : '대표 이미지 업로드'}
              </button>
            </section>
          )}
        </div>

        <div className="flex justify-between gap-4 bg-[#232428] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-[#ff5c00] px-4 py-3 font-bold text-[#ff5c00] transition-colors hover:bg-[#ff5c00]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            닫기
          </button>
          <button
            onClick={handleCreateOrJoin}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-[#ff5c00] px-4 py-3 font-bold text-white transition-colors hover:bg-[#e65300] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '처리중...' : '다음'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
