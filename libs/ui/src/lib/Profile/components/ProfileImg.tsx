'use client';

import { colors, typography } from '../../../design';
import { useImg } from '../../../hooks';
import { useProfile } from '../../../context';
import { useEffect } from 'react';
import { uploadProfileImage } from '@org/shop-data';

export function ProfileImg() {
  const {
    fileInputRef,
    previewUrl,
    localImageFile,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();
  const { profile, silentRefetchProfile } = useProfile();

  // 프로필 이미지 선택 시 즉시 업로드
  useEffect(() => {
    if (localImageFile) {
      const upload = async () => {
        try {
          await uploadProfileImage(localImageFile);
          await silentRefetchProfile();
        } catch (e) {
          console.error('프로필 이미지 업로드 실패', e);
        }
      };
      upload();
    }
  }, [localImageFile, silentRefetchProfile]);

  // 새로 업로드한 이미지가 있으면 previewUrl, 없으면 서버의 이미지를 사용합니다.
  // 명세에 따라 profileImageUrl 또는 기존 profileImage 필드를 참조합니다.
  const displayImage =
    previewUrl || profile?.profileImageUrl || profile?.profileImage;

  return (
    <section className="flex justify-between items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 style={{ ...typography.body.BodyB }}>프로필 대표 이미지 지정</h2>
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
        {displayImage ? (
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#D9D9D9]" />
        )}
      </div>
    </section>
  );
}
