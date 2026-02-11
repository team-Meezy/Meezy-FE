import { privateApi } from '../axios';

export const deleteAccount = async (password: string) => {
  const body = {
    password,
  };
  try {
    const response = await privateApi.delete('/profile', { data: body });
    console.log('deleteAccount response', response);
    return response.data;
  } catch (error) {
    console.log('deleteAccount error', error);
    throw error;
  }
};
