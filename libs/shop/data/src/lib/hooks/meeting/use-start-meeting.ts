import { privateApi } from '../axios';

export const startMeeting = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/meetings`);
    console.log('startMeeting response', response);
    return response.data;
  } catch (error) {
    console.log('startMeeting error', error);
    throw error;
  }
};
