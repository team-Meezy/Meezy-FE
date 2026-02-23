import { publicApi } from '../axios';

export const verifyEmailCode = async (email: string, code: string) => {
  try {
    const response = await publicApi.post('/email/verify', {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
