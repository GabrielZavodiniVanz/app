import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaLock, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Todos os campos são obrigatórios');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('A nova senha e confirmação não coincidem');
      return false;
    }

    if (formData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.newPassword === formData.currentPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/api/auth/change-password`, formData);
      
      toast.success('Senha alterada com sucesso!');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <FaLock />
          </div>
          <h2>Cambiar Contraseña</h2>
          <p className={styles.authSubtitle}>Ingresa tu contraseña actual y la nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              name="email"
              placeholder="Seu e-mail" 
              value={formData.email} 
              onChange={handleInputChange}
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input 
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              placeholder="Contraseña actual" 
              value={formData.currentPassword} 
              onChange={handleInputChange}
              required 
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input 
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              placeholder="Nueva contraseña" 
              value={formData.newPassword} 
              onChange={handleInputChange}
              required 
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input 
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmar nueva contraseña" 
              value={formData.confirmPassword} 
              onChange={handleInputChange}
              required 
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Cambiando...
              </>
            ) : (
              <>
                <FaCheck />
                Cambiar Contraseña
              </>
            )}
          </button>
          
          <p className={styles.switchMessage}>
            ¿Recordaste tu contraseña? <a href="/login">Iniciar sesión</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
