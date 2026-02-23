import { privateApi } from '../axios';

export const updateTeamName = async (teamId: string, name: string) => {
  const body = {
    name,
  };
  try {
    const response = await privateApi.patch(`teams/${teamId}/name`, body);
    return response.data;
  } catch (error) {
    throw error;
  }
};
