import { privateApi } from '../axios';

export const getMeetingFeedbacks = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}/feedbacks`, {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
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
