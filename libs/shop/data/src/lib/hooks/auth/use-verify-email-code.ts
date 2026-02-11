import { publicApi } from '../axios';

export const useVerifyEmailCode = async (email: string, code: string) => {
  try {
    const response = await publicApi.post('/email/verify', {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
