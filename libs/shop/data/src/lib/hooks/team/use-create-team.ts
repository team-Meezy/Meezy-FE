import { privateApi } from '../axios';

export const createTeam = async (name: string, image: File) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('serverImage', image);

    const response = await privateApi.post('/teams', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
