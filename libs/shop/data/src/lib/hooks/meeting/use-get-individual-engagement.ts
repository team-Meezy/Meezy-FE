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
    return response.data;
  } catch (error) {
    throw error;
  }
};
