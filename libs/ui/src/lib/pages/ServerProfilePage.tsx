'use client';

import { useState, useEffect } from 'react';
import { colors, typography } from '../../design';
import { useImg } from '../../hooks';
import Image from 'next/image';
import {
  useServerState,
  useServerJoinedTeam,
  type TeamMember,
} from '../../context';
import { KickMember } from '../../assets/index.client';
import { useRouter } from 'next/navigation';
import { useServerIdStore } from '@org/shop-data';
import {
  updateTeamName,
  updateTeamImage,
  expelTeamMember,
  deleteTeam,
} from '@org/shop-data';
import { useTeamStore } from '@org/shop-data';

export function ServerProfilePage() {
  const router = useRouter();

  const [tab, setTab] = useState(true);
  const { teams, setTeams } = useTeamStore();
  const {
    updateTeams,
    teamMembers,
    setTeamMembers, // 멤버 목록 전역 상태 업데이트를 위해 추가
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

  // 선택된 이미지 파일이 있으면 서버 이미지 업데이트 API 자동 호출
  useEffect(() => {
    if (localImageFile && serverId) {
      updateTeamImage(serverId, localImageFile)
        .then(() => {
          alert('서버 이미지가 변경되었습니다.');
          updateTeams();
        })
        .catch((err) => {
          console.error('서버 이미지 변경 실패:', err);
          alert('서버 이미지 변경에 실패했습니다.');
        });
    }
  }, [localImageFile, serverId, updateTeams]);

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

  const onKickUser = async (id: string) => {
    if (!serverId || !id) return;

    try {
      await expelTeamMember(serverId, id);

      // 로컬 상태(현재 페이지) 업데이트
      setUsers((prev) => prev.filter((user) => user.teamMemberId !== id));

      // 전역 상태(사이드바 등) 업데이트
      setTeamMembers((prev) => prev.filter((user) => user.teamMemberId !== id));

      setContextMenuUserId(null);
      alert('멤버가 제외되었습니다.');
    } catch (error) {
      console.error('멤버 제외 실패:', error);
      alert('멤버 제외에 실패했습니다.');
    }
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
    // setTeams((prev) => prev.filter((team) => team.teamId !== serverId));

    // 즉시 페이지 이동 및 상태 초기화
    setServerId('');
    setJoined(false);
    router.push('/main');

    try {
      await deleteTeam(serverId);
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
      await updateTeamName(serverId, serverName);
      alert('서버 이름이 변경되었습니다.');
      // 사이드바 목록 갱신
      await updateTeams();
    } catch (error) {
      console.error('서버 이름 변경 실패:', error);
      alert('서버 이름 변경에 실패했습니다.');
    }
  };

  return (
    <div
      className="flex-1 min-h-screen p-12 md:p-20 lg:p-24 flex flex-col gap-10 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: colors.black[100], color: '#FFFFFF' }}
    >
      {/* 탭 메뉴 */}
      <div className="flex gap-6 border-b border-white/10 pb-4">
        <button
          className="px-8 py-4 rounded-xl transition-all font-bold"
          style={tapStyle(tab)}
          onClick={onTabProfile}
        >
          서버 프로필
        </button>
        <button
          className="px-8 py-4 rounded-xl transition-all font-bold"
          style={tapStyle(!tab)}
          onClick={onTabSettings}
        >
          설정
        </button>
      </div>

      {/* 헤더 섹션 */}
      <section className="flex flex-col gap-6">
        <h1 style={{ ...typography.title.TitleB, fontSize: '3rem' }}>
          {tab ? '서버 프로필' : '서버 설정'}
        </h1>
        <p style={{ ...typography.body.BodyB, color: colors.gray[400], fontSize: '1.25rem' }}>
          {tab
            ? '공개적으로 보일 서버 프로필인 서버 이름, 서버 아이콘 등을 정해주세요!'
            : '서버의 전체적인 설정을 조정할 수 있습니다.'}
        </p>
      </section>

      <hr className="border-white/10" />

      {/* 중앙 섹션 */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 style={{ ...typography.body.BodyB, fontSize: '1.5rem' }}>
            {tab ? '이름' : '팀원 관리'}
          </h2>
          {!tab && (
            <p style={{ ...typography.label.labelB, color: colors.gray[400], fontSize: '1rem' }}>
              팀원을 내보낼 수 있습니다.
            </p>
          )}
        </div>
        {tab ? (
          <div className="flex gap-6 items-center">
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full max-w-xl h-16 px-8 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF5C00] transition-all bg-[#1e1e1e] border border-white/5"
              style={{
                color: '#FFFFFF',
                ...typography.body.BodyM,
                fontSize: '1.125rem'
              }}
            />
            <button
              onClick={handleUpdateServerName}
              className="h-16 px-10 rounded-2xl bg-[#FF5C00] hover:bg-[#E55200] transition-all shrink-0 font-bold text-lg shadow-[0_10px_40px_rgba(255,92,0,0.2)] active:scale-95"
              style={{ color: '#FFFFFF' }}
            >
              저장
            </button>
          </div>
        ) : (
          <div
            className="w-full max-h-[50vh] overflow-y-scroll flex flex-col gap-6 no-scrollbar"
            style={{
              ...typography.body.BodyB,
            }}
          >
            {users.map((user) => (
              <div
                key={user.teamMemberId}
                className="flex gap-4 items-center justify-between px-8 py-6 rounded-2xl bg-[#1e1e1e] border border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex gap-6 items-center">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-800 border border-white/5" />
                  )}
                  <div className="text-xl font-medium">{user.name}</div>
                </div>
                <button
                  onClick={() => {
                    console.log(user.teamMemberId);
                    setContextMenuUserId(user.teamMemberId);
                    onKickUser(user.teamMemberId);
                  }}
                  className="w-10 h-10 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Image
                    src={KickMember}
                    alt="kickMember"
                    className="w-8 h-8 opacity-60 hover:opacity-100 transition-opacity"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="border-white/10" />

      {/* 서버 footer 섹션 */}
      <section className="flex flex-col gap-8">
        <div className="flex justify-between items-start gap-12">
          <div className="flex flex-col gap-4 flex-1">
            <h2 style={{ ...typography.body.BodyB, fontSize: '1.5rem' }}>
              {tab ? '서버 대표 이미지 지정' : '서버 관리'}
            </h2>

            {tab ? (
              <div className="flex flex-col gap-6">
                <p
                  style={{
                    ...typography.label.labelM,
                    color: colors.gray[400],
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}
                >
                  서버 대표 이미지를 정해주세요!
                  <br />
                  최소 512 x 512 크기로 지정해주세요.
                </p>

                <div className="flex gap-4 mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  <button
                    className="px-8 py-4 rounded-2xl bg-[#FF5C00] hover:bg-[#E55200] transition-all font-bold shadow-[0_10px_40px_rgba(255,92,0,0.1)] active:scale-95"
                    style={{ color: '#FFFFFF' }}
                    onClick={handleClickUpload}
                  >
                    이미지 업로드
                  </button>
                  <button
                    className="px-8 py-4 rounded-2xl bg-[#1e1e1e] hover:bg-[#2a2a2a] transition-all border border-white/5 font-bold"
                    style={{
                      color: colors.gray[400],
                    }}
                    onClick={handleDeleteImg}
                  >
                    이미지 삭제
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex p-8 rounded-2xl mt-4 bg-red-500/5 border border-red-500/20 justify-between items-center"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-bold text-red-500">서버 삭제</p>
                  <p className="text-sm text-red-500/60">모든 데이터가 영구적으로 삭제됩니다. 주의하세요!</p>
                </div>
                <button 
                  onClick={handleDeleteServer}
                  className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all font-bold active:scale-95"
                >
                  서버 삭제
                </button>
              </div>
            )}
          </div>

          {/* 이미지 미리보기 박스 */}
          <div className="w-48 h-48 rounded-3xl bg-[#1e1e1e] border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="서버 대표 이미지 미리보기"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-700 font-bold tracking-widest">NO IMAGE</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
