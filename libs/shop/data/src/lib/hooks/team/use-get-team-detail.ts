import { privateApi } from '../axios';

export const getTeamDetail = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
