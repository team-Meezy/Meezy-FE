import { privateApi } from '../axios';

export const getTeamDetail = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}`);
    console.log('getTeamDetail response', response);
    return response.data;
  } catch (error) {
    console.log('getTeamDetail error', error);
    throw error;
  }
};
