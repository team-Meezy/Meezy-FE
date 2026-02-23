import { useState, useRef, useEffect } from 'react';
import { useServerCreate } from '../context/ServerCreateProvider';
import { uploadProfileImage } from '@org/shop-data';
import { useProfile } from '../context';

export const useImg = () => {
  const { setImageFile } = useServerCreate();
  const { silentRefetchProfile } = useProfile();
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

  const handleDeleteImg = () => {
    setPreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    skipAutoUpload?: boolean
  ) => {
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

    // skipAutoUpload가 true면 여기서 멈춤 (개인 프로필 자동 업로드 방지)
    if (skipAutoUpload) return;

    // 파일 선택 후 서버에 업로드 (기본적으로 개인 프로필 업로드로 동작)
    try {
      await uploadProfileImage(file);
      console.log('프로필 이미지 업로드 성공');
      await silentRefetchProfile();
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return {
    previewUrl,
    fileInputRef,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  };
};
