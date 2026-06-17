import { privateApi } from '../axios';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string,
  recordingBlob: Blob,
  fileName = 'recording.mp3',
  title?: string
) => {
  try {
    const formData = new FormData();
    const recordingFile = new File([recordingBlob], fileName, {
      type: 'audio/mpeg',
    });
    formData.append('file', recordingFile);
    if (title?.trim()) {
      formData.append('title', title.trim());
    }

    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`,
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
