import { privateApi } from '../axios';

export const uploadProfileImage = async (image: File) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', image);

    const response = await privateApi.patch('profile/image', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
