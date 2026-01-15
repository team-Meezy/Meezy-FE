'use client';

import { useState, useRef, useEffect } from 'react';
import { useServerCreate } from '../context/ServerCreateProvider';

export const useModalImg = () => {
  const { setImageFile } = useServerCreate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 가능합니다.');
      return;
    }

    setImageFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  return {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
  };
};
