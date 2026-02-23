import { privateApi } from '../axios';

export const createInviteCode = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/invite-code`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
