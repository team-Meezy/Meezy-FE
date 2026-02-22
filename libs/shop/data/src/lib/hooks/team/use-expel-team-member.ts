import { privateApi } from '../axios';

export const useExpelTeamMember = async (teamId: string, memberId: string) => {
  try {
    const response = await privateApi.delete(
      `/teams/${teamId}/members/${memberId}`
    );
    console.log('expelTeamMember response', response);
    return response.data;
  } catch (error) {
    console.log('expelTeamMember error', error);
    throw error;
  }
};
