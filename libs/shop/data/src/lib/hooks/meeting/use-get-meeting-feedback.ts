import { privateApi } from '../axios';

export const getMeetingFeedback = async (teamId: string, meetingId: string) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/feedback`
    );
    console.log('getMeetingFeedback response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingFeedback error', error);
    throw error;
  }
};
