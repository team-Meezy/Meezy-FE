import { privateApi } from '../axios';

export const getMeetingFeedback = async (teamId: string, meetingId: string) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/feedback`,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      }
    );
    if (response.status === 404) {
      return { status: 404, data: null };
    }
    console.log('getMeetingFeedback response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingFeedback error', error);
    throw error;
  }
};
