import { privateApi } from '../axios';

export const getTotalEngagement = async (teamId: string, meetingId: string) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/participation`
    );
    console.log('getTotalEngagement response', response);
    return response.data;
  } catch (error) {
    console.log('getTotalEngagement error', error);
    throw error;
  }
};
