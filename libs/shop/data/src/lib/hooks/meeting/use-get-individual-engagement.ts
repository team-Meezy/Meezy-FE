import { privateApi } from '../axios';

export const getIndividualEngagement = async (
  teamId: string,
  meetingId: string
) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/participation/member`
    );
    console.log('getIndividualEngagement response', response);
    return response.data;
  } catch (error) {
    console.log('getIndividualEngagement error', error);
    throw error;
  }
};
