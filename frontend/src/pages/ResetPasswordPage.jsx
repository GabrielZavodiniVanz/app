import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaLock, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Token de recuperação não encontrado.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    if (!token) {
      toast.error('Token de recuperação não encontrado.');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({ 
        token, 
        newPassword, 
        confirmPassword 
      });
      
      setPasswordReset(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authWrapper}>
          <div className={styles.authHeader}>
            <div className={styles.authIcon} style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
              <FaCheckCircle />
            </div>
            <h2>¡Contraseña Restablecida!</h2>
            <p className={styles.authSubtitle}>Tu contraseña ha sido cambiada con éxito</p>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              background: '#e8f5e8', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #4CAF50'
            }}>
              <p style={{ margin: 0, color: '#2e7d32', fontSize: '16px' }}>
                ✅ ¡Tu contraseña ha sido restablecida con éxito!
              </p>
            </div>

            <button
              type="button"
              className={styles.submitButton}
              onClick={() => navigate('/login')}
              style={{ 
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
              }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <FaLock />
          </div>
            <h2>Restablecer Contraseña</h2>
            <p className={styles.authSubtitle}>Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div style={{ 
            background: '#fff3cd', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              <strong>⚠️ Importante:</strong>
              <br/>• La contraseña debe tener al menos 6 caracteres
              <br/>• Usa una contraseña fuerte y segura
              <br/>• Este enlace expira en 1 hora
            </p>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
          >
            {isLoading ? (
              <>
                <FaSpinner className={styles.spinner} />
                Restableciendo...
              </>
            ) : (
              'Restablecer Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
