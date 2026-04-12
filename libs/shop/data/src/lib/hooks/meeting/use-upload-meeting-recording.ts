import { privateApi } from '../axios';
import { logRecordingUpload } from '../../recording-console';

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

    logRecordingUpload('request', {
      teamId,
      meetingId,
      stage: 'multipart-formdata',
      fileName,
      title: title?.trim() ?? '',
      size: recordingFile.size,
      type: recordingFile.type,
    });

    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`,
      formData
    );
    logRecordingUpload('success', {
      teamId,
      meetingId,
      status: response.status,
      fileName,
      title,
      size: recordingFile.size,
      type: recordingFile.type,
    });
    return response.data;
  } catch (error) {
    logRecordingUpload('error', {
      teamId,
      meetingId,
      fileName,
      title,
      size: recordingBlob.size,
      type: 'audio/mpeg',
      error,
    });
    throw error;
  }
};
