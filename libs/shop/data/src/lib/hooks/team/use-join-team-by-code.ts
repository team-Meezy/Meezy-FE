import { privateApi } from '../axios';

export const joinTeamByCode = async (inviteCode: string) => {
  const body = {
    inviteCode,
  };
  try {
    const response = await privateApi.post('/teams/join', body);
    return response.data;
  } catch (error) {
    throw error;
  }
};
