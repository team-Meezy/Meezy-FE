import { privateApi } from '../axios';
import type { MeetingResponse } from './types';

export const joinMeeting = async (teamId: string): Promise<MeetingResponse> => {
  try {
    const response = await privateApi.post<MeetingResponse>(
      `/teams/${teamId}/meetings/join`,
      {}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
