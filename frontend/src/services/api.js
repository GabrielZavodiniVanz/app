import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

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

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);


export default apiClient;