import { privateApi } from '../axios';

export const useJoinTeamByCode = async (inviteCode: string) => {
  const body = {
    inviteCode,
  };
  try {
    const response = await privateApi.post('/teams/join', body);
    console.log('joinTeamByCode response', response);
    return response.data;
  } catch (error) {
    console.log('joinTeamByCode error', error);
    throw error;
  }
};
