import { privateApi } from '../axios';

export const expelTeamMember = async (teamId: string, memberId: string) => {
  try {
    const response = await privateApi.delete(
      `/teams/${teamId}/members/${memberId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
