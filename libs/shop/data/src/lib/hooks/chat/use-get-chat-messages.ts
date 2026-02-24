import { privateApi } from '../axios';

export const getChatMessages = async (teamId: string, chatRoomId: string) => {
  try {
    const response = await privateApi.get(
      `teams/${teamId}/chat-rooms/${chatRoomId}/messages`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
