import { privateApi } from '../axios';

export const deleteChatRoom = async (teamId: string, chatRoomId: string) => {
  try {
    const response = await privateApi.delete(
      `teams/${teamId}/chat-rooms/${chatRoomId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
