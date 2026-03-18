'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../../design';
import { useImg } from '../../hooks';
import { useRouter } from 'next/navigation';
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

export function ServerModal({ isOpen, onClose }: ServerModalProps) {
  const {
    mounted,
    setMounted,
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

  // useImg에서 선택된 파일을 서버 생성 컨텍스트에 동기화
  useEffect(() => {
    setImageFile(localImageFile);
  }, [localImageFile, setImageFile]);
  const { setJoined } = useServerJoinedTeam();
  const { updateTeams, updateTeamMembers } = useServerState();
  const router = useRouter();
  const { serverId } = useServerIdStore();
  const { setServerId } = useServerIdStore();

  const handleTeamClick = (id?: string) => {
    router.push(`/main/${id || serverId}`);
  };

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

  const createServer = async () => {
    const valueToValidate = createModal ? serverName : serverLink;
    if (!valueToValidate) {
      setGeneralError(
        `${createModal ? '서버 이름을 입력해주세요.' : '링크를 입력해주세요.'}`
      );
      return false;
    }
    if (createModal) {
      if (!localImageFile) {
        setGeneralError('서버 대표 이미지를 업로드해주세요.');
        return false;
      }
      
      try {
        const res = await createTeam(serverName, localImageFile);
        console.log('createTeam full response body:', res);
        
        // res가 숫자나 문자열인 경우 (직접 ID 반환)
        // res 내부의 다양한 ID 레이블
        // res.data 내부의 다양한 ID 레이블
        // res가 배열인 경우 첫 번째 요소의 ID
        let newTeamId = 
          (typeof res === 'number' && res !== 0 || (typeof res === 'string' && res !== '')) ? res :
          (res?.teamId || res?.team_id || res?.id || 
           res?.data?.teamId || res?.data?.team_id || res?.data?.id ||
           (Array.isArray(res) && (res[0]?.teamId || res[0]?.team_id || res[0]?.id)));

        // [Fallback] 응답에 ID가 없는 경우 (서버에서 생성은 되었으나 응답 바디가 비어있을 때)
        if (!newTeamId) {
          console.warn('No ID in response, attempting fallback lookup...');
          const teams = await getTeams();
          if (Array.isArray(teams)) {
            // 이번에 새로 만든 서버 이름과 일치하는 팀 찾기
            const found = teams.find((t: any) => t.teamName === serverName || t.name === serverName);
            if (found) {
              newTeamId = found.teamId || found.team_id || found.id;
            } else if (teams.length > 0) {
              // 찾지 못했다면 가장 최근 팀(첫 번째)으로 간주
              newTeamId = teams[0].teamId || teams[0].team_id || teams[0].id;
            }
          }
        }

        if (newTeamId) {
          const stringId = String(newTeamId);
          console.log('Found teamId (including fallback):', stringId);
          await updateTeams();

          setServerId(stringId);
          setJoined(true);
          router.push(`/main/${stringId}`);
          onClose();
          return;
        } else {
          console.error('No ID found even after fallback:', JSON.stringify(res));
          setGeneralError('서버에서 팀 식별정보를 찾을 수 없습니다.');
        }
      } catch (e: any) {
        const msg = e.response?.data?.message || e.message || '팀 생성 실패';
        console.error('Team creation error detail:', e);
        setGeneralError(msg);
      }
    } else {
      // 가입 로직 (!createModal)
      try {
        const extractedCode = serverLink.split('/').pop() || serverLink;
        const res = await joinTeamByCode(extractedCode);
        console.log('joinTeamByCode full response body:', res);

        let newTeamId = 
          (typeof res === 'number' && res !== 0 || (typeof res === 'string' && res !== '')) ? res :
          (res?.teamId || res?.team_id || res?.id || 
           res?.data?.teamId || res?.data?.team_id || res?.data?.id ||
           (Array.isArray(res) && (res[0]?.teamId || res[0]?.team_id || res[0]?.id)));

        // [Fallback] 가입 시에도 응답이 없으면 최신 팀 목록에서 첫 번째 것 사용
        if (!newTeamId) {
          console.warn('No ID in join response, attempting fallback lookup...');
          const teams = await getTeams();
          if (Array.isArray(teams) && teams.length > 0) {
            newTeamId = teams[0].teamId || teams[0].team_id || teams[0].id;
          }
        }

        if (newTeamId) {
          const stringId = String(newTeamId);
          console.log('Found teamId (including fallback):', stringId);
          await updateTeams();

          setServerId(stringId);
          setJoined(true);
          router.push(`/main/${stringId}`);
          onClose();
          return;
        } else {
          console.error('No ID found even after fallback:', JSON.stringify(res));
          setGeneralError('서버에서 팀 식별정보를 찾을 수 없습니다.');
        }
      } catch (e: any) {
        const msg = e.response?.data?.message || e.message || '팀 가입 실패';
        console.error('Team join error detail:', e);
        setGeneralError(msg);
      }
    }
  };

  if (!isOpen || !mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(
    // 배경 Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      {/*   모달 컨테이너 */}
      <div className="w-[480px] bg-[#2b2d31] rounded-xl shadow-2xl border border-white/5 overflow-hidden">
        {/* 상단 탭 및 닫기 버튼 */}
        <div className="flex justify-between items-center px-4 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModal(true)}
              style={{ ...typography.body.BodyM }}
              className={`${
                createModal ? 'bg-[#404040] text-[#fff] rounded-xl' : ''
              } p-3 text-[#A1A1AA]`}
            >
              서버 만들기
            </button>
            <button
              onClick={() => setCreateModal(false)}
              style={{ ...typography.body.BodyM }}
              className={`${
                createModal ? '' : 'bg-[#404040] text-[#fff]'
              } rounded-xl p-3 text-[#A1A1AA]`}
            >
              서버 가입하기
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center w-full h-[1px] mt-3">
          <div
            className="w-[94%] h-[1px] bg-white rounded-full"
            style={{ backgroundColor: colors.gray[700] }}
          />
        </div>

        {/* // 폼 콘텐츠 */}
        <div className="p-6 pt-4 flex flex-col gap-6">
          {/* 서버 이름 입력 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-1">
              {createModal ? '서버 만들기' : '서버 가입하기'}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {createModal
                ? '회의를 위한 서버를 만들어 보세요!'
                : '초대 받은 서버 가입을 위해 링크를 입력 해주세요.'}
            </p>
            {generalError && (
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

            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
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
              placeholder={createModal ? '서버 이름' : '초대 받은 링크를 입력'}
              className="w-full bg-[#1e1f22] border-none rounded-md p-3 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </section>

          {createModal && (
            //   {/* 서버 이미지 지정 */}
            <section className="border-t border-white/5 pt-3">
              <h2 className="text-xl font-bold text-white mb-1">
                서버 대표 이미지 지정
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                서버 대표 이미지를 정해주세요!
                <br />
                최소 512 x 512 크기로 지정해주세요.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {previewUrl && (
                <div className="flex flex-col items-start mb-4">
                  <img
                    src={previewUrl}
                    alt="서버 대표 이미지 미리보기"
                    className="w-42 h-32 rounded-lg object-cover border border-white/10"
                  />
                </div>
              )}

              <button
                className="bg-[#ff5c00] hover:bg-[#e65300] text-white text-sm font-bold py-2 px-4 rounded-md transition-colors"
                onClick={handleClickUpload}
              >
                {previewUrl ? '이미지 변경' : '대표 이미지 업로드'}
              </button>
            </section>
          )}
        </div>

        {/* 하단 버튼 바 */}
        <div className="bg-[#232428] px-6 py-4 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#ff5c00] text-[#ff5c00] rounded-md font-bold hover:bg-[#ff5c00]/10 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={createServer}
            className="flex-1 py-3 px-4 bg-[#ff5c00] text-white rounded-md font-bold hover:bg-[#e65300] transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
