import { privateApi } from '../axios';

export const getTeamMembers = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}/members`);
    console.log('getTeamMembers response', response);
    return response.data;
  } catch (error) {
    console.log('getTeamMembers error', error);
    throw error;
  }
};
