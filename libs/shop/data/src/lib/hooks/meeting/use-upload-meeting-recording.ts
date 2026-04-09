import { privateApi } from '../axios';
import { logRecordingUpload } from '../../recording-console';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string,
  recordingBlob: Blob,
  fileName = 'recording.mp3'
) => {
  try {
    const formData = new FormData();
    const recordingFile = new File([recordingBlob], fileName, {
      type: 'audio/mpeg',
    });
    formData.append('file', recordingFile);

    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`,
      formData
    );
    logRecordingUpload('success', {
      teamId,
      meetingId,
      status: response.status,
      fileName,
      size: recordingFile.size,
      type: recordingFile.type,
    });
    return response.data;
  } catch (error) {
    logRecordingUpload('error', {
      teamId,
      meetingId,
      fileName,
      size: recordingBlob.size,
      type: 'audio/mpeg',
      error,
    });
    throw error;
  }
};
