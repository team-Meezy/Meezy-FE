import { privateApi } from '../axios';

export const updateChatRoomName = async (
  teamId: string,
  chatRoomId: string,
  name: string
) => {
  const body = {
    name,
  };

  try {
    const response = await privateApi.patch(
      `teams/${teamId}/chat-rooms/${chatRoomId}/name`,
      body
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
