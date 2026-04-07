import { privateApi } from '../axios';
import type { MeetingResponse } from './types';

export const joinMeeting = async (teamId: string): Promise<MeetingResponse> => {
  try {
    const response = await privateApi.post<MeetingResponse>(
      `/teams/${teamId}/meetings/join`,
      {}
    );
    console.log('joinMeeting response', response);
    return response.data;
  } catch (error) {
    console.log('joinMeeting error', error);
    throw error;
  }
};
