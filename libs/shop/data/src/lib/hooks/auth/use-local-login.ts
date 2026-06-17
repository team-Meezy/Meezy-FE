import { publicApi } from '../axios';

export const localLogin = async (accountId: string, password: string) => {
  try {
    const response = await publicApi.post('/auth/login', {
      accountId,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
