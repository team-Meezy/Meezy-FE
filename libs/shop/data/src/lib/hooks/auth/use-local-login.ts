import { publicApi } from '../axios';

export const localLogin = async (accountId: string, password: string) => {
  const response = await publicApi.post('/auth/login', {
    accountId,
    password,
  });
  return response.data;
};
