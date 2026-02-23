import { privateApi } from '../axios';

export const getMyProfile = async () => {
  try {
    const response = await privateApi.get('/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};
