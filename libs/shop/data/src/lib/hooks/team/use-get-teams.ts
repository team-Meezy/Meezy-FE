import { privateApi } from '../axios';

export const getTeams = async () => {
  try {
    const response = await privateApi.get('/teams');
    return response.data;
  } catch (error) {
    throw error;
  }
};
