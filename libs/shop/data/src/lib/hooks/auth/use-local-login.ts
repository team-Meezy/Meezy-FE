import { publicApi } from '../axios';

export const useLocalLogin = async (email: string, password: string) => {
  try {
    const response = await publicApi.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
