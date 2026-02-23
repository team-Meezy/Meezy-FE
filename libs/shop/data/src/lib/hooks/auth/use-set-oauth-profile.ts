import { privateApi } from '../axios';

export const setOauthProfile = async (
  accountId: string,
  name: string,
  password: string
) => {
  const body = {
    accountId: accountId,
    name: name,
    password: password,
  };
  try {
    const response = await privateApi.post('profile/setup', body);
    return response.data;
  } catch (error) {
    throw error;
  }
};
