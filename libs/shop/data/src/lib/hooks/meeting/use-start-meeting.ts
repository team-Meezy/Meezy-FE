import { privateApi } from '../axios';
import type { MeetingResponse } from './types';

export const startMeeting = async (
  teamId: string,
  title: string
): Promise<MeetingResponse> => {
  try {
    const response = await privateApi.post<MeetingResponse>(
      `/teams/${teamId}/meetings`,
      { title }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
