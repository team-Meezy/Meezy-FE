import { publicApi } from '../axios';

export const useRequestEmailVerification = async (email: string) => {
  try {
    const response = await publicApi.post('/email/send', {
      email,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
