import { privateApi } from '../axios';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string
) => {
  try {
    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`
    );
    console.log('uploadMeetingRecording response', response);
    return response.data;
  } catch (error) {
    console.log('uploadMeetingRecording error', error);
    throw error;
  }
};
