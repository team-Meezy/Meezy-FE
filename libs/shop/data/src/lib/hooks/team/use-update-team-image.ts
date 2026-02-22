import { privateApi } from '../axios';

export const useUpdateTeamImage = async (teamId: string, image: File) => {
  try {
    const formData = new FormData();
    formData.append('serverImage', image);

    const response = await privateApi.patch(
      `/teams/${teamId}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('updateTeamImage response', response);
    return response.data;
  } catch (error) {
    console.log('updateTeamImage error', error);
    throw error;
  }
};
