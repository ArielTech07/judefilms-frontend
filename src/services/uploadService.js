import api from './api';

/**
 * Sube un archivo PDF al backend, que a su vez lo envía a Cloudflare R2.
 * @param {File} file - El archivo PDF seleccionado por el usuario.
 * @returns {Promise<{url: string, fileName: string}>}
 */
export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data; 
};
