import { privateApi } from '../axios';
import { logRecordingUpload } from '../../recording-console';

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
    logRecordingUpload('success', {
      teamId,
      meetingId,
      status: response.status,
      fileName,
      size: recordingBlob.size,
      type: recordingBlob.type,
    });
    return response.data;
  } catch (error) {
    logRecordingUpload('error', {
      teamId,
      meetingId,
      fileName,
      size: recordingBlob.size,
      type: recordingBlob.type,
      error,
    });
    throw error;
  }
};
