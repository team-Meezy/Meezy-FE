import { privateApi } from '../axios';

export const uploadProfileImage = async (image: File) => {
  try {
    const formData = new FormData();
    formData.append('image', image);

    const response = await privateApi.patch('profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('이미지 변경 성공', response);
    return response.data;
  } catch (error) {
    throw error;
  }
};
