import axios from 'axios';

// URL base da nossa API de autenticação
const API_URL = 'http://localhost:5000/api/auth';

/**
 * Registra um novo usuário.
 * @param {object} userData - Dados do usuário { name, email, password }
 */
export const registerUser = (userData) => {
  return axios.post(`${API_URL}/register`, userData);
};

/**
 * Loga um usuário existente.
 * @param {object} credentials - Credenciais do usuário { email, password }
 * @returns {Promise<string>} O token JWT.
 */
export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  // Retorna apenas o token para ser usado no AuthContext
  return response.data.token;
};