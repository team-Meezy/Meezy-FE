import { privateApi } from '../axios';
import type { IndividualEngagementResponse } from './types';

export const getIndividualEngagement = async (
  teamId: string,
  meetingId: string
): Promise<IndividualEngagementResponse> => {
  try {
    const response = await privateApi.get<IndividualEngagementResponse>(
      `/teams/${teamId}/meetings/${meetingId}/participation/member`
    );
    console.log('getIndividualEngagement response', response);
    return response.data;
  } catch (error) {
    console.log('getIndividualEngagement error', error);
    throw error;
  }
};
