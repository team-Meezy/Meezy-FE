import { privateApi } from '../axios';
import type { MeetingSummaryResponse } from './types';

export const getMeetingSummaries = async (
  teamId: string
): Promise<MeetingSummaryResponse[] | { status: 404; data: null }> => {
  try {
    const response = await privateApi.get<MeetingSummaryResponse[]>(
      `/teams/${teamId}/summaries`,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      }
    );
    if (response.status === 404) {
      return { status: 404, data: null };
    }
    console.log('getMeetingSummaries response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingSummaries error', error);
    throw error;
  }
};
