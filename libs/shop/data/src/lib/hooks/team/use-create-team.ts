import { privateApi } from '../axios';

export const useCreateTeam = async (name: string, serverImage: string) => {
  const body = {
    name,
    serverImage,
  };
  try {
    const response = await privateApi.post('/teams', { data: body });
    console.log('createTeam response', response);
    return response.data;
  } catch (error) {
    console.log('createTeam error', error);
    throw error;
  }
};
