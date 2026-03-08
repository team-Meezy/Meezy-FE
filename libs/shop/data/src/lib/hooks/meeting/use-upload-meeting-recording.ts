import { privateApi } from '../axios';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string,
  recordingBlob: Blob
) => {
  try {
    const formData = new FormData();
    // 백엔드 문서상 MP3(audio/mpeg) 형식을 요구하므로, 파일명을 recording.mp3로 고정합니다.
    const fileName = 'recording.mp3';

    // 벨류 값은 'file' 키로 설정합니다.
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
