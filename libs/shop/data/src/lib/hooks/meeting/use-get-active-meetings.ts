import { privateApi } from '../axios';
import type { MeetingResponse } from './types';

export const getActiveMeetings = async (
  teamId: string
): Promise<MeetingResponse> => {
  try {
    const response = await privateApi.get<MeetingResponse>(
      `/teams/${teamId}/meetings/active`
    );
    console.log('getActiveMeetings response', response);
    return response.data;
  } catch (error) {
    console.log('getActiveMeetings error', error);
    throw error;
  }
};
