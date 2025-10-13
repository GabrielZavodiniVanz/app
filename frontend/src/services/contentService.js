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
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado. Faça login novamente.');
  }
  
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content/documentos/${id}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }
  
  return await response.blob();
};

// ==========================================================
// --- FUNÇÕES DE NÍVEIS DE ACESSO ---
// ==========================================================

/**
 * Busca todos os níveis de acesso disponíveis. (Rota Protegida por Admin)
 * @returns {Promise<Object>} Lista de níveis de acesso e hierarquia.
 */
export const getAccessLevels = async () => {
  const response = await apiClient.get('/content/access-levels');
  return response.data;
};

/**
 * Busca todas as categorias de conteúdo disponíveis. (Rota Protegida por Admin)
 * @returns {Promise<Object>} Lista de categorias de conteúdo.
 */
export const getContentCategories = async () => {
  const response = await apiClient.get('/content/content-categories');
  return response.data;
};