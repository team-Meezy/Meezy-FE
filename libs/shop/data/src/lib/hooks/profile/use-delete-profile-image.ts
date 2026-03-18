import { privateApi } from '../axios';

export const deleteProfileImage = async () => {
  try {
    const response = await privateApi.delete('profile/image');
    return response.data;
  } catch (error) {
    throw error;
  }
};
