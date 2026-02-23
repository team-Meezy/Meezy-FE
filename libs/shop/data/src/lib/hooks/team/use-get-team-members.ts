import { privateApi } from '../axios';

export const getTeamMembers = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}/members`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
