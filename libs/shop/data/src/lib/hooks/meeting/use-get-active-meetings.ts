import { privateApi } from '../axios';

export const getActiveMeetings = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}/meetings/active`);
    console.log('getActiveMeetings response', response);
    return response.data;
  } catch (error) {
    console.log('getActiveMeetings error', error);
    throw error;
  }
};
