import { privateApi } from '../axios';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string,
  recordingBlob: Blob,
  fileName = 'recording.webm'
) => {
  try {
    const formData = new FormData();
    formData.append('file', recordingBlob, fileName);

    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`,
      formData
    );
    console.log('uploadMeetingRecording response', response);
    return response.data;
  } catch (error) {
    console.log('uploadMeetingRecording error', error);
    throw error;
  }
};
