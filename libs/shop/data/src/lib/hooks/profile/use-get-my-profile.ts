import { privateApi } from '../axios';

export const getMyProfile = async () => {
  try {
    const response = await privateApi.get('/profile');
    console.log('getMyProfile response', response);
    return response.data;
  } catch (error) {
    console.log('getMyProfile error', error);
  }
};
