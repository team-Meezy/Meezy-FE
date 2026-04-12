import { privateApi } from '../axios';
import type { MeetingFeedbackResponse } from './types';

export const getMeetingFeedbacks = async (
  teamId: string
): Promise<MeetingFeedbackResponse[] | { status: 404; data: null }> => {
  try {
    const response = await privateApi.get<MeetingFeedbackResponse[]>(
      `/teams/${teamId}/feedbacks`,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      }
    );
    if (response.status === 404) {
      return { status: 404, data: null };
    }
    console.log('getMeetingFeedbacks response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingFeedbacks error', error);
    throw error;
  }
};
