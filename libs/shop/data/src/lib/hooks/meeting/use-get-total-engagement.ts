import { privateApi } from '../axios';
import type { TotalEngagementResponse } from './types';

export const getTotalEngagement = async (
  teamId: string,
  meetingId: string
): Promise<TotalEngagementResponse> => {
  try {
    const response = await privateApi.get<TotalEngagementResponse>(
      `/teams/${teamId}/meetings/${meetingId}/participation`
    );
    console.log('getTotalEngagement response', response);
    return response.data;
  } catch (error) {
    console.log('getTotalEngagement error', error);
    throw error;
  }
};
