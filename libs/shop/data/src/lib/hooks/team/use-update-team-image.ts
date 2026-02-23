import { privateApi } from '../axios';

export const updateTeamImage = async (teamId: string, image: File) => {
  try {
    const formData = new FormData();
    formData.append('serverImage', image);

    const response = await privateApi.patch(`/teams/${teamId}/image`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
