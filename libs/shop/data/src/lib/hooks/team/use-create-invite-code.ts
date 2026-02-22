import { privateApi } from '../axios';

export const useCreateInviteCode = async (teamId: string) => {
  try {
    const response = await privateApi.post(`/teams/${teamId}/invite-code`);
    console.log('createInviteCode response', response);
    return response.data;
  } catch (error) {
    console.log('createInviteCode error', error);
    throw error;
  }
};
