'use client';

import { useState } from 'react';
import { colors, typography } from '../design'; // 기존 디자인 시스템 유지
import { useImg } from '../hooks/useImg';
import Image from 'next/image';

const user = {
  name: 'John Doe',
  id: '123456789',
  email: 'john.doe@example.com',
  profileImg: null,
};

export function MyPageComponent() {
  const [tab, setTab] = useState(true); // 'profile' | 'settings'
  const [userName, setUserName] = useState(user.name);
  const [userId, setUserId] = useState(user.id);
  const [userEmail, setUserEmail] = useState(user.email);

  const {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();

  const onTabProfile = () => setTab(true);
  const onTabSettings = () => setTab(false);

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
          {tab ? '프로필' : '설정'}
        </h1>
        <p style={{ ...typography.body.BodyB, color: colors.gray[400] }}>
          {tab
            ? '공개적으로 보일 프로필인 이름, 대표 이미지 등을정해주세요!'
            : '개인의 전체적인 설정을 조정할 수 있습니다.'}
        </p>
      </section>

      <hr className="border-white/10" />

      {/* 3. 프로필 이미지 섹션 */}
      <section className="flex justify-between items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 style={{ ...typography.body.BodyB }}>
              프로필 대표 이미지 지정
            </h2>
            <p style={{ ...typography.label.labelM, color: colors.gray[400] }}>
              프로필 대표 이미지를 정해주세요! <br />
              최소 512 x 512 크기로 지정해주세요.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              className="px-4 py-2 rounded-md bg-[#FF5C00] hover:bg-[#E55200] transition-colors"
              style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
              onClick={handleClickUpload}
            >
              대표 이미지 업로드
            </button>
            <button
              className="px-4 py-2 rounded-md bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors"
              style={{ ...typography.body.BodyB, color: colors.gray[400] }}
              onClick={handleDeleteImg}
            >
              대표 이미지 삭제
            </button>
          </div>
        </div>

        {/* 이미지 미리보기 박스 */}
        <div className="w-24 h-24 rounded-xl bg-[#D9D9D9] flex items-center justify-center overflow-hidden shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#D9D9D9]" />
          )}
        </div>
      </section>

      {/* 4. 입력 필드 섹션 */}
      <section className="flex flex-col gap-4">
        {/* 이름 필드 */}
        <div className="flex flex-col gap-3">
          <label style={{ ...typography.body.BodyB }}>이름</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full max-w-lg h-10 px-4 rounded-lg outline-none border border-transparent focus:border-[#FF5C00] transition-all"
            style={{
              backgroundColor: '#1C1C1E',
              color: '#FFFFFF',
              ...typography.body.BodyM,
            }}
          />
        </div>

        <hr className="border-white/10" />

        {/* 아이디 필드 */}
        <div className="flex flex-col gap-3">
          <label style={{ ...typography.body.BodyB }}>아이디</label>
          <input
            type="text"
            value={userId}
            readOnly
            className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
            style={{
              backgroundColor: '#1C1C1E',
              color: '#FFFFFF',
              ...typography.body.BodyM,
            }}
          />
        </div>

        <hr className="border-white/10" />

        {/* 이메일 필드 */}
        <div className="flex flex-col gap-3">
          <label style={{ ...typography.body.BodyB }}>이메일</label>
          <input
            type="email"
            value={userEmail}
            readOnly
            className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
            style={{
              backgroundColor: '#1C1C1E',
              color: '#FFFFFF',
              ...typography.body.BodyM,
            }}
          />
        </div>
      </section>
    </div>
  );
}
