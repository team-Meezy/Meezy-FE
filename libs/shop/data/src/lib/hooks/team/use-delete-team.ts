import { privateApi } from '../axios';

export const useDeleteTeam = async (teamId: string) => {
  try {
    const response = await privateApi.delete(`/teams/${teamId}`);
    console.log('deleteTeam response', response);
    return response.data;
  } catch (error) {
    console.log('deleteTeam error', error);
    throw error;
  }
};
