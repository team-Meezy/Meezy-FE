import { privateApi } from '../axios';

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await privateApi.patch('profile/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
