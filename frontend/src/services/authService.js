import axios from 'axios';

// URL base da nossa API de autenticação
const API_URL = `${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/api/auth`;


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

/**
 * Altera a senha de um usuário logado.
 * @param {object} data - Dados { email, currentPassword, newPassword, confirmPassword }
 */
export const changePassword = async (data) => {
  const response = await axios.put(`${API_URL}/change-password`, data);
  return response.data;
};

/**
 * Solicita recuperação de senha.
 * @param {string} email - Email do usuário
 */
export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/forgot-password`, { email }, {
    timeout: 15000 // 15 segundos de timeout
  });
  return response.data;
};

/**
 * Redefine a senha com token.
 * @param {object} data - Dados { token, newPassword, confirmPassword }
 */
export const resetPassword = async (data) => {
  const response = await axios.post(`${API_URL}/reset-password`, data);
  return response.data;
};