import { privateApi } from '../axios';
import type { MeetingResponse } from './types';

export const getActiveMeetings = async (
  teamId: string
): Promise<MeetingResponse> => {
  try {
    const response = await privateApi.get<MeetingResponse>(
      `/teams/${teamId}/meetings/active`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
