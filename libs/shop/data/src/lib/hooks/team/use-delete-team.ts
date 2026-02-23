import { privateApi } from '../axios';

export const deleteTeam = async (teamId: string) => {
  try {
    const response = await privateApi.delete(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
