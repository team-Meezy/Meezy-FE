import { privateApi } from '../axios';

export const deleteAccount = async (password: string) => {
  const body = {
    password,
  };
  try {
    const response = await privateApi.delete('/profile', { data: body });
    return response.data;
  } catch (error) {
    throw error;
  }
};
