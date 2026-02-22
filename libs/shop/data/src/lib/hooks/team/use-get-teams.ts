import { privateApi } from '../axios';

export const getTeams = async () => {
  try {
    const response = await privateApi.get('/teams');
    console.log('getTeams response', response);
    return response.data;
  } catch (error) {
    console.log('getTeams error', error);
    throw error;
  }
};
