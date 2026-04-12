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
    console.log('startMeeting response', response);
    return response.data;
  } catch (error) {
    console.log('startMeeting error', error);
    throw error;
  }
};
