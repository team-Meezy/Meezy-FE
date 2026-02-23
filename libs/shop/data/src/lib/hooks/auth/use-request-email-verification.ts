import { publicApi } from '../axios';

export const requestEmailVerification = async (email: string) => {
  try {
    const response = await publicApi.post('/email/send', {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
