import { BASE_URL, privateApi } from '../axios';

export const leaveMeeting = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/meetings/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const leaveMeetingOnUnload = (teamId: string) => {
  if (typeof window === 'undefined' || !teamId) return;

  const token = window.localStorage.getItem('accessToken');
  if (!token) return;

  const url = `${BASE_URL}/teams/${teamId}/meetings/leave`;

  void fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    keepalive: true,
    credentials: 'include',
  }).catch(() => undefined);
};
