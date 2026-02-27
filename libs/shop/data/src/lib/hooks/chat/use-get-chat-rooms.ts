import { privateApi } from '../axios';

export const getChatRooms = async (teamId: string) => {
  try {
    const response = await privateApi.get(`/teams/${teamId}/chat-rooms`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
