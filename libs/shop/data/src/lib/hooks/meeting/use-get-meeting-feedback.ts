import { privateApi } from '../axios';
import type { MeetingFeedbackResponse } from './types';

export const getMeetingFeedback = async (
  teamId: string,
  meetingId: string
): Promise<MeetingFeedbackResponse | { status: 404; data: null }> => {
  try {
    const response = await privateApi.get<MeetingFeedbackResponse>(
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
