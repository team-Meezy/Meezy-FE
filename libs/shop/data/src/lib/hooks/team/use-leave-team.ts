import { privateApi } from '../axios';

export const leaveTeam = async (teamId: string) => {
  try {
    const response = await privateApi.delete(`/teams/${teamId}/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
