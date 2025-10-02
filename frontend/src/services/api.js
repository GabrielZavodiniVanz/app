import axios from 'axios';
import toast from 'react-hot-toast'; // Importamos o toast para dar feedback

// Cria uma instância do Axios com configurações base
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// --- INTERCEPTOR DE REQUISIÇÃO (Request Interceptor) ---
// Roda ANTES de cada requisição ser enviada
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- NOVO: INTERCEPTOR DE RESPOSTA (Response Interceptor) ---
// Roda DEPOIS que uma resposta chega (ou dá erro)
apiClient.interceptors.response.use(
  // Se a resposta for bem-sucedida (status 2xx), apenas a retorna
  (response) => {
    return response;
  },
  // Se a resposta der erro...
  (error) => {
    // Verificamos se o erro é um '401 Unauthorized'
    if (error.response && error.response.status === 401) {
      // Limpa o token inválido do armazenamento
      localStorage.removeItem('token');
      
      // Mostra uma notificação amigável para o usuário
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');

      // Força um redirecionamento para a página de login
      // Usamos window.location para garantir que todo o estado do React seja limpo
      window.location.href = '/login';
    }
    
    // Para qualquer outro erro, apenas o repassa
    return Promise.reject(error);
  }
);


export default apiClient;