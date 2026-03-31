'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  deleteTeam,
  expelTeamMember,
  updateTeamImage,
  updateTeamName,
  useServerIdStore,
  useTeamStore,
} from '@org/shop-data';
import { colors } from '../../design';
import { useImg } from '../../hooks';
import {
  KickMember,
} from '../../assets/index.client';
import {
  type TeamMember,
  useServerJoinedTeam,
  useServerState,
} from '../../context';

export function ServerProfilePage() {
  const router = useRouter();
  const [isProfileTab, setIsProfileTab] = useState(true);
  const { teams } = useTeamStore();
  const {
    updateTeams,
    teamMembers,
    setTeamMembers,
    setContextMenuUserId,
  } = useServerState();
  const { setJoined } = useServerJoinedTeam();
  const { serverId, setServerId } = useServerIdStore();
  const [serverName, setServerName] = useState('');
  const [users, setUsers] = useState<TeamMember[]>(teamMembers);
  const {
    previewUrl,
    localImageFile,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();

  useEffect(() => {
    if (localImageFile && serverId) {
      updateTeamImage(serverId, localImageFile)
        .then(() => {
          alert('서버 이미지가 변경되었습니다.');
          updateTeams();
        })
        .catch((error) => {
          console.error('서버 이미지 변경 실패:', error);
          alert('서버 이미지 변경에 실패했습니다.');
        });
    }
  }, [localImageFile, serverId, updateTeams]);

  useEffect(() => {
    if (!serverId || teams.length === 0) return;

    const currentTeam = teams.find((team) => team.teamId === serverId);
    if (currentTeam) {
      setServerName(currentTeam.teamName);
    }
  }, [serverId, teams]);

  useEffect(() => {
    setUsers(teamMembers);
  }, [teamMembers]);

  const handleKickUser = async (teamMemberId: string) => {
    if (!serverId || !teamMemberId) return;

    try {
      await expelTeamMember(serverId, teamMemberId);
      setUsers((prev) => prev.filter((user) => user.teamMemberId !== teamMemberId));
      setTeamMembers((prev) =>
        prev.filter((user) => user.teamMemberId !== teamMemberId)
      );
      setContextMenuUserId(null);
      alert('멤버가 추방되었습니다.');
    } catch (error) {
      console.error('멤버 추방 실패:', error);
      alert('멤버 추방에 실패했습니다.');
    }
  };

  const handleDeleteServer = async () => {
    setServerId('');
    setJoined(false);
    router.push('/main');

    try {
      await deleteTeam(serverId);
      await updateTeams();
    } catch (error) {
      console.error('서버 삭제 실패:', error);
      await updateTeams();
    }
  };

  const handleUpdateServerName = async () => {
    if (!serverId) {
      alert('서버 정보를 찾을 수 없습니다.');
      return;
    }

    if (!serverName.trim()) {
      alert('서버 이름을 입력해주세요.');
      return;
    }

    try {
      await updateTeamName(serverId, serverName);
      alert('서버 이름이 변경되었습니다.');
      await updateTeams();
    } catch (error) {
      console.error('서버 이름 변경 실패:', error);
      alert('서버 이름 변경에 실패했습니다.');
    }
  };

  const tabClassName = (isActive: boolean) =>
    `rounded-xl px-4 py-2 text-[clamp(0.72rem,0.9vw,0.84rem)] font-semibold transition-colors sm:px-5 ${
      isActive
        ? 'bg-[#2a2a2a] text-white'
        : 'bg-transparent text-[#727272] hover:text-white'
    }`;

  return (
    <div
      className="no-scrollbar flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8"
      style={{ backgroundColor: colors.black[100], color: '#FFFFFF' }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <button
            className={tabClassName(isProfileTab)}
            onClick={() => setIsProfileTab(true)}
          >
            서버 프로필
          </button>
          <button
            className={tabClassName(!isProfileTab)}
            onClick={() => setIsProfileTab(false)}
          >
            설정
          </button>
        </div>

        <section className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <h1 className="text-[clamp(1.45rem,1.9vw,2.15rem)] font-bold tracking-[-0.04em] text-white">
            {isProfileTab ? '서버 프로필' : '서버 설정'}
          </h1>
          <p className="text-[clamp(0.76rem,0.92vw,0.9rem)] leading-[1.8] text-[#9b9b9b]">
            {isProfileTab
              ? '공개적으로 보일 서버 프로필인 서버 이름, 서버 아이콘 등을 정해주세요!'
              : '서버의 전체적인 설정과 멤버 관리를 조정할 수 있습니다.'}
          </p>
        </section>

        <section className="flex flex-col gap-5 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[clamp(1.1rem,1.4vw,1.45rem)] font-bold text-white">
              {isProfileTab ? '이름' : '멤버 관리'}
            </h2>
            {!isProfileTab && (
              <p className="text-[clamp(0.76rem,0.92vw,0.88rem)] text-[#8d8d8d]">
                서버에 참여 중인 멤버를 관리할 수 있습니다.
              </p>
            )}
          </div>

          {isProfileTab ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={serverName}
                onChange={(event) => setServerName(event.target.value)}
                className="h-12 w-full max-w-[560px] rounded-xl border border-white/5 bg-[#303030] px-5 text-[clamp(0.86rem,0.98vw,1rem)] text-white outline-none transition-all placeholder:text-white/30 focus:ring-1 focus:ring-[#FF5C00]"
              />
              <button
                onClick={handleUpdateServerName}
                className="h-12 shrink-0 rounded-xl bg-[#FF5C00] px-7 text-[clamp(0.84rem,0.96vw,0.96rem)] font-bold text-white transition-colors hover:bg-[#E55200]"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="no-scrollbar flex max-h-[42vh] flex-col gap-2 overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.teamMemberId}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-[#d9d9d9]" />
                    )}
                    <span className="text-[clamp(0.84rem,0.98vw,0.98rem)] font-medium text-white">
                      {user.name}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setContextMenuUserId(user.teamMemberId);
                      void handleKickUser(user.teamMemberId);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-red-500/10"
                  >
                    <Image
                      src={KickMember}
                      alt="kickMember"
                      className="h-4 w-4 opacity-60 transition-opacity hover:opacity-100"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-5 pb-6">
          <div
            className={`grid grid-cols-1 gap-6 ${
              isProfileTab
                ? 'lg:grid-cols-[minmax(0,1fr)_120px] lg:items-start xl:grid-cols-[minmax(0,1fr)_140px]'
                : ''
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[clamp(1.1rem,1.4vw,1.45rem)] font-bold text-white">
                  {isProfileTab ? '서버 대표 이미지 지정' : '서버 관리'}
                </h2>

                {isProfileTab ? (
                  <p className="text-[clamp(0.76rem,0.92vw,0.88rem)] leading-[1.8] text-[#9b9b9b]">
                    서버 대표 이미지를 정해주세요.
                    <br />
                    최소 512 x 512 크기로 지정해주세요.
                  </p>
                ) : (
                  <p className="text-[clamp(0.76rem,0.92vw,0.88rem)] leading-[1.8] text-[#9b9b9b]">
                    서버를 완전히 삭제하면 복구할 수 없습니다.
                  </p>
                )}
              </div>

              {isProfileTab ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  <button
                    className="rounded-xl bg-[#FF5C00] px-5 py-3 text-[clamp(0.76rem,0.9vw,0.88rem)] font-bold text-white transition-colors hover:bg-[#E55200]"
                    onClick={handleClickUpload}
                  >
                    대표 이미지 업로드
                  </button>
                  <button
                    className="rounded-xl bg-[#2b2b2b] px-5 py-3 text-[clamp(0.76rem,0.9vw,0.88rem)] font-bold text-[#8f8f8f] transition-colors hover:bg-[#343434]"
                    onClick={handleDeleteImg}
                  >
                    대표 이미지 삭제
                  </button>
                </div>
              ) : (
                <div className="flex">
                  <button
                    onClick={handleDeleteServer}
                    className="rounded-lg bg-[#2a2a2a] px-4 py-2.5 text-[clamp(0.76rem,0.9vw,0.88rem)] font-bold text-[#9d9d9d] transition-colors hover:bg-red-500 hover:text-white"
                  >
                    서버 삭제
                  </button>
                </div>
              )}
            </div>

            {isProfileTab && (
              <div className="flex justify-start lg:justify-end">
                <div className="flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-[20px] border border-white/5 bg-[#1f1f1f] xl:h-[130px] xl:w-[130px]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="서버 대표 이미지 미리보기"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-[clamp(0.62rem,0.7vw,0.74rem)] font-bold tracking-[0.18em] text-[#47516a]">
                      NO IMAGE
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
