import api from './client';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
