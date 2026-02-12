import { privateApi } from '../axios';

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await privateApi.patch('profile/password', {
      currentPassword,
      newPassword,
    });
    console.log('변경 성공', response);
    return response.data;
  } catch (error) {
    throw error;
  }
};
