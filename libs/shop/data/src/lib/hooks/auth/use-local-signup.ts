import { publicApi } from '../axios';

export const localSignup = async (
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
    throw error;
  }
};
