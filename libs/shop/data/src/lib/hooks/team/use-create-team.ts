import { privateApi } from '../axios';

export const useCreateTeam = async (name: string, image: File) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('serverImage', image);

    const response = await privateApi.post('/teams', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('useCreateTeam response', response);
    return response.data;
  } catch (error) {
    console.log('useCreateTeam error', error);
    throw error;
  }
};
