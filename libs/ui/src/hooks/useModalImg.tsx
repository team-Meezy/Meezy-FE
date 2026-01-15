'use client';

import { useState, useRef } from 'react';

export const useModalImg = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
  };
};
