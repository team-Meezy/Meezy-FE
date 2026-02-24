import { privateApi } from '../axios';

export const createChatRoom = async (teamId: string, name: string) => {
  const body = {
    name,
  };

  try {
    const response = await privateApi.post(`/teams/${teamId}/chat-rooms`, body);
    return response.data;
  } catch (error) {
    throw error;
  }
};
