'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../../design';
import { useImg } from '../../hooks';
import Image from 'next/image';
import { useServerState, useServerJoinedTeam } from '../../context';
import { KickMember } from '../../assets/index.client';
import { useDeleteTeam } from '@org/shop-data';
import { useRouter } from 'next/navigation';
import { useServerIdStore } from '@org/shop-data';
import { useUpdateTeamName, useUpdateTeamImage } from '@org/shop-data';
import { useServerCreate } from '../../context';

interface ServerProfilePageProps {
  projectSidebarList: {
    team_id: number;
    team_name: string;
    create_at: null;
    invite_link: string;
  }[];
}

export function ServerProfilePage() {
  const router = useRouter();

  const [tab, setTab] = useState(true);
  const { setTeams, updateTeams, teamMembers, teams } = useServerState();
  const { setJoined } = useServerJoinedTeam();
  const { serverId, setServerId } = useServerIdStore();
  const { imageFile, setImageFile } = useServerCreate();

  const [serverName, setServerName] = useState('');
  const [users, setUsers] = useState(teamMembers);
  const {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();

  useEffect(() => {
    if (serverId && teams.length > 0) {
      const currentTeam = teams.find((t) => t.teamId === serverId);
      if (currentTeam) {
        setServerName(currentTeam.teamName);
      }
    }
  }, [serverId, teams]);

  useEffect(() => {
    setUsers(teamMembers);
  }, [teamMembers]);

  const onTabProfile = () => setTab(true);
  const onTabSettings = () => setTab(false);

  const onKickUser = (teamMemberId: string) => {
    setUsers((prev) =>
      prev.filter((user) => user.teamMemberId !== teamMemberId)
    );
  };

  const tapStyle = (tab: boolean) => {
    if (tab) {
      return {
        ...typography.body.BodyB,
        color: colors.white[100],
        backgroundColor: colors.gray[800],
      };
    } else {
      return {
        ...typography.body.BodyB,
        color: colors.gray[400],
        backgroundColor: 'transparent',
      };
    }
  };

  const handleDeleteServer = async () => {
    setTeams((prev) => prev.filter((team) => team.teamId !== serverId));

    // 즉시 페이지 이동 및 상태 초기화
    setServerId('');
    setJoined(false);
    router.push('/main');

    try {
      await useDeleteTeam(serverId);
      // API 완료 후 최신 목록으로 다시 동기화
      await updateTeams();
    } catch (error) {
      console.error('서버 삭제 실패:', error);
      // 실패 시 원래 데이터를 복구하기 위해 다시 불러옴
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
      await useUpdateTeamName(serverId, serverName);
      alert('서버 이름이 변경되었습니다.');
      // 사이드바 목록 갱신
      await updateTeams();
    } catch (error) {
      console.error('서버 이름 변경 실패:', error);
      alert('서버 이름 변경에 실패했습니다.');
    }
  };

  const onServerImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !serverId) return;

    try {
      await useUpdateTeamImage(serverId, file);
      alert('서버 이미지가 변경되었습니다.');
      // 파일 상태 업데이트 및 미리보기는 handleImageChange에서 처리됨 (훅 연동 필요 시)
      await updateTeams();
    } catch (error) {
      console.error('서버 이미지 변경 실패:', error);
      alert('서버 이미지 변경에 실패했습니다.');
    }
  };

  return (
    <div
      className="flex-[3] min-h-screen p-5 flex flex-col gap-5 border border-white/5"
      style={{ backgroundColor: colors.black[100], color: '#FFFFFF' }}
    >
      {/* 탭 메뉴 */}
      <div className="flex gap-3 border-b border-white/10 pb-2">
        <button
          className="px-5 py-3 rounded-md"
          style={tapStyle(tab)}
          onClick={onTabProfile}
        >
          서버 프로필
        </button>
        <button
          className="px-5 py-3 rounded-md"
          style={tapStyle(!tab)}
          onClick={onTabSettings}
        >
          설정
        </button>
      </div>

      {/* 헤더 섹션 */}
      <section className="flex flex-col gap-4">
        <h1 style={{ ...typography.title.sTitleB }}>
          {tab ? '서버 프로필' : '서버 설정'}
        </h1>
        <p style={{ ...typography.body.BodyB, color: colors.gray[400] }}>
          {tab
            ? '공개적으로 보일 서버 프로필인 서버 이름, 서버 아이콘 등을 정해주세요!'
            : '서버의 전체적인 설정을 조정할 수 있습니다.'}
        </p>
      </section>

      <hr className="border-white/10" />

      {/* 중앙 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 style={{ ...typography.body.BodyB }}>
            {tab ? '이름' : '팀원 관리'}
          </h2>
          {!tab && (
            <p style={{ ...typography.label.labelB, color: colors.gray[400] }}>
              팀원을 내보낼 수 있습니다.
            </p>
          )}
        </div>
        {tab ? (
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full max-w-sm h-12 px-4 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              style={{
                backgroundColor: colors.gray[800],
                color: '#FFFFFF',
                ...typography.body.BodyM,
              }}
            />
            <button
              onClick={handleUpdateServerName}
              className="h-12 px-6 rounded-lg bg-[#FF5C00] hover:bg-[#E55200] transition-colors shrink-0"
              style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
            >
              저장
            </button>
          </div>
        ) : (
          <div
            className="w-full max-h-[30vh] overflow-y-scroll flex flex-col gap-4 no-scrollbar"
            style={{
              ...typography.body.BodyB,
            }}
          >
            {users.map((user) => (
              <div
                key={user.teamMemberId}
                className="flex gap-2 items-center justify-between px-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-9 h-9 rounded-full bg-gray-800" />
                  <div>{user.name}</div>
                </div>
                <button
                  onClick={() => onKickUser(user.teamMemberId)}
                  className="w-7 h-7"
                >
                  <Image
                    src={KickMember}
                    alt="kickMember"
                    className="w-7 h-7"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="border-white/10" />

      {/* 서버 footer 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <h2 style={{ ...typography.body.BodyB }}>
              {tab ? '서버 대표 이미지 지정' : '서버 관리'}
            </h2>

            {tab ? (
              <>
                <p
                  style={{
                    ...typography.label.labelM,
                    color: colors.gray[400],
                  }}
                >
                  서버 대표 이미지를 정해주세요!
                  <br />
                  최소 512 x 512 크기로 지정해주세요.
                </p>

                <div className="flex gap-3 mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleImageChange(e); // 미리보기 처리
                      onServerImageChange(e); // 서버 전송
                    }}
                  />

                  <button
                    className="px-4 py-2.5 rounded-md bg-[#FF5C00] hover:bg-[#E55200] transition-colors"
                    style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
                    onClick={handleClickUpload}
                  >
                    대표 이미지 업로드
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                    style={{
                      ...typography.body.BodyB,
                      color: colors.gray[400],
                    }}
                    onClick={handleDeleteImg}
                  >
                    대표 이미지 삭제
                  </button>
                </div>
              </>
            ) : (
              <div
                className="flex px-3 py-2.5 rounded-md mt-1"
                style={{
                  ...typography.body.BodyB,
                  backgroundColor: colors.gray[600],
                }}
              >
                <button onClick={handleDeleteServer}>서버 삭제</button>
              </div>
            )}
          </div>

          {/* 이미지 미리보기 박스 */}
          <div className="w-42 h-42 rounded-xl bg-[#D9D9D9] shrink-0">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="서버 대표 이미지 미리보기"
                className="w-32 h-32 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
