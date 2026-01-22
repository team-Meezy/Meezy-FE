'use client';

import { useState } from 'react';
import { colors, typography } from '../../design';
import { useImg } from '../../hooks';
import Image from 'next/image';
import { KickMember } from '../../assets/index.client';

interface ServerProfilePageProps {
  userList: {
    user_id: number;
    team_id: number;
    user_name: string;
    create_at: null;
    img: null;
  }[];
  projectSidebarList: {
    team_id: number;
    team_name: string;
    create_at: null;
    invite_link: string;
  }[];
}

export function ServerProfilePage({
  userList,
  projectSidebarList,
}: ServerProfilePageProps) {
  const [serverName, setServerName] = useState(
    projectSidebarList?.[0]?.team_name || ''
  );

  // 팀 선택 시 서버 이름 변경
  const selectTeam = (team_name: string) => {
    setServerName(team_name);
  };

  const [tab, setTab] = useState(true);
  const [users, setUsers] = useState(userList);
  const {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();

  const onTabProfile = () => setTab(true);
  const onTabSettings = () => setTab(false);

  const onKickUser = (userId: number) => {
    setUsers((prev) => prev.filter((user) => user.user_id !== userId));
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
          <>
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
          </>
        ) : (
          <div
            className="w-full max-h-[30vh] overflow-y-scroll flex flex-col gap-4 no-scrollbar"
            style={{
              ...typography.body.BodyB,
            }}
          >
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex gap-2 items-center justify-between px-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-9 h-9 rounded-full bg-gray-800" />
                  <div>{user.user_name}</div>
                </div>
                <button
                  onClick={() => onKickUser(user.user_id)}
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
                    onChange={handleImageChange}
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
                <button>서버 삭제</button>
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
