import { privateApi } from '../axios';
import type { TotalEngagementResponse } from './types';

export const getTotalEngagement = async (
  teamId: string,
  meetingId: string
): Promise<TotalEngagementResponse | { status: 404; data: null }> => {
  try {
    const response = await privateApi.get<TotalEngagementResponse>(
      `/teams/${teamId}/meetings/${meetingId}/participation`,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      }
    );
    if (response.status === 404) {
      return { status: 404, data: null };
    }
    console.log('getTotalEngagement response', response);
    return response.data;
  } catch (error) {
    console.log('getTotalEngagement error', error);
    throw error;
  }
};
