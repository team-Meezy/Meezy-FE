import { privateApi } from '../axios';

export const joinMeeting = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/meetings/join`);
    console.log('joinMeeting response', response);
    return response.data;
  } catch (error) {
    console.log('joinMeeting error', error);
    throw error;
  }
};
