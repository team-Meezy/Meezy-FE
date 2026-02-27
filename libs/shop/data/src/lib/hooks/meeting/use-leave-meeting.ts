import { privateApi } from '../axios';

export const leaveMeeting = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/meetings/leave`);
    console.log('leaveMeeting response', response);
    return response.data;
  } catch (error) {
    console.log('leaveMeeting error', error);
    throw error;
  }
};
