import apiClient from './api'; // Importa nossa instância configurada do Axios

// ==========================================================
// --- FUNÇÕES DE VÍDEOS ---
// ==========================================================

/**
 * Busca todos os vídeos. (Rota Pública)
 * @returns {Promise<Array>} Uma lista de vídeos.
 */
export const getVideos = async () => {
  const response = await apiClient.get('/content/videos');
  return response.data;
};

/**
 * Cria um novo vídeo. (Rota Protegida por Admin)
 * @param {FormData} formData - Os dados do formulário, incluindo o arquivo.
 */
export const createVideo = async (formData) => {
  const response = await apiClient.post('/content/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Atualiza um vídeo existente. (Rota Protegida por Admin)
 * @param {string|number} id - O ID do vídeo a ser atualizado.
 * @param {FormData} formData - Os novos dados do vídeo.
 */
export const updateVideo = async (id, formData) => {
  const response = await apiClient.put(`/content/videos/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Deleta um vídeo. (Rota Protegida por Admin)
 * @param {string|number} id - O ID do vídeo a ser deletado.
 */
export const deleteVideo = async (id) => {
  const response = await apiClient.delete(`/content/videos/${id}`);
  return response.data;
};


// ==========================================================
// --- FUNÇÕES DE DOCUMENTOS ---
// ==========================================================

/**
 * Busca todos os documentos. (Rota Pública)
 * @returns {Promise<Array>} Uma lista de documentos.
 */
export const getDocuments = async () => {
  const response = await apiClient.get('/content/documentos');
  return response.data;
};

/**
 * Cria um novo documento. (Rota Protegida por Admin)
 * @param {FormData} formData - Os dados do formulário, incluindo o arquivo.
 */
export const createDocument = async (formData) => {
  const response = await apiClient.post('/content/documentos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Atualiza um documento existente. (Rota Protegida por Admin)
 * @param {string|number} id - O ID do documento a ser atualizado.
 * @param {FormData} formData - Os novos dados do documento.
 */
export const updateDocument = async (id, formData) => {
  const response = await apiClient.put(`/content/documentos/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Deleta um documento. (Rota Protegida por Admin)
 * @param {string|number} id - O ID do documento a ser deletado.
 */
export const deleteDocument = async (id) => {
  const response = await apiClient.delete(`/content/documentos/${id}`);
  return response.data;
};

/**
 * Baixa um arquivo de documento através do backend. (Rota Protegida)
 * @param {string|number} id - O ID do documento a ser baixado.
 * @returns {Promise<Blob>} O arquivo como um objeto Blob.
 */
export const downloadDocument = async (id) => {
  const response = await apiClient.get(`/content/documentos/${id}/download`, {
    responseType: 'blob', // MUITO IMPORTANTE: diz ao axios para tratar a resposta como um arquivo
  });
  return response.data;
};