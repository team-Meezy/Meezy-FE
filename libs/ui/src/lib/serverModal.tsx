'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { colors, typography } from '../design';

export function ServerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1️⃣ 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 2️⃣ 파일 크기 검증 (예: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 가능합니다.');
      return;
    }

    // 3️⃣ 상태 저장
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  if (!isOpen || !mounted) return null;

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(
    // 1. 배경 Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      {/* 2. 모달 컨테이너 */}
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
        {/* 폼 콘텐츠 */}
        <div className="p-6 pt-4 flex flex-col gap-6">
          {/* 서버 이름 입력 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-1">서버 만들기</h2>
            <p className="text-xs text-gray-400 mb-4">
              회의를 위한 서버를 만들어 보세요!
            </p>

            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
              이름
            </label>
            <input
              type="text"
              placeholder="서버 이름"
              className="w-full bg-[#1e1f22] border-none rounded-md p-3 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </section>

          {previewUrl && (
            <div className="flex flex-col items-center gap-1">
              <img
                src={previewUrl}
                alt="서버 대표 이미지 미리보기"
                className="w-42 h-32 rounded-lg object-cover border border-white/10"
              />
              <span className="text-xs text-gray-400">선택된 이미지</span>
            </div>
          )}

          {/* 서버 이미지 지정 */}
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
            <button
              className="bg-[#ff5c00] hover:bg-[#e65300] text-white text-sm font-bold py-2 px-4 rounded-md transition-colors"
              onClick={handleClickUpload}
            >
              대표 이미지 업로드
            </button>
          </section>
        </div>

        {/* 하단 버튼 바 */}
        <div className="bg-[#232428] px-6 py-4 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#ff5c00] text-[#ff5c00] rounded-md font-bold hover:bg-[#ff5c00]/10 transition-colors"
          >
            닫기
          </button>
          <button className="flex-1 py-3 px-4 bg-[#ff5c00] text-white rounded-md font-bold hover:bg-[#e65300] transition-colors">
            다음
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
