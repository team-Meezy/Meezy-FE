import { publicApi } from '../axios';

export const useLocalSignup = async (
  email: string,
  accountId: string,
  name: string,
  password: string
) => {
  try {
    const body = {
      email,
      accountId,
      name,
      password,
    };
    const response = await publicApi.post('auth/signup', body);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
