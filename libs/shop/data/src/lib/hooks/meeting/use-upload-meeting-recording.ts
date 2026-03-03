import { privateApi } from '../axios';

export const uploadMeetingRecording = async (
  teamId: string,
  meetingId: string
) => {
  try {
    // 유저가 공유한 스펙(Body Example: { })에 맞춰 빈 객체를 전송합니다.
    const response = await privateApi.post(
      `/teams/${teamId}/meetings/${meetingId}/recording`,
      {}
    );
    console.log('uploadMeetingRecording response', response);
    return response.data;
  } catch (error) {
    console.log('uploadMeetingRecording error', error);
    throw error;
  }
};
