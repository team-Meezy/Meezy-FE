import { publicApi } from '../axios';

export const useLocalLogin = async (accountId: string, password: string) => {
  try {
    const response = await publicApi.post('/auth/login', {
      accountId,
      password,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
