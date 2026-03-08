import { privateApi } from '../axios';

export const getMeetingSummary = async (teamId: string, meetingId: string) => {
  try {
    const response = await privateApi.get(
      `/teams/${teamId}/meetings/${meetingId}/summary`,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      }
    );
    if (response.status === 404) {
      // 404일 땐 굳이 에러를 던지지 않고 커스텀 객체 반환
      return { status: 404, data: null };
    }
    console.log('getMeetingSummary response', response);
    return response.data;
  } catch (error) {
    console.log('getMeetingSummary error', error);
    throw error;
  }
};
