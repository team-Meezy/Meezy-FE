import { privateApi } from '../axios';

export const getMeetingSummary = async (teamId: string, meetingId: string) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/summary`
    );
    console.log('getMeetingSummary response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingSummary error', error);
    throw error;
  }
};
