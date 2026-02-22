import { privateApi } from '../axios';

export const useUpdateTeamName = async (teamId: string, name: string) => {
  const body = {
    name,
  };
  try {
    const response = await privateApi.patch(`teams/${teamId}/name`, body);
    console.log('updateTeamName response', response);
    return response.data;
  } catch (error) {
    console.log('updateTeamName error', error);
    throw error;
  }
};
