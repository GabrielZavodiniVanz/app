import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { forgotPassword } from '../services/authService';
import toast from 'react-hot-toast';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setEmailSent(true);
      toast.success('E-mail enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authWrapper}>
          <div className={styles.authHeader}>
            <div className={styles.authIcon}>
              <FaEnvelope />
            </div>
            <h2>¡Email Enviado!</h2>
            <p className={styles.authSubtitle}>Verifica tu bandeja de entrada</p>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Enviamos un enlace de recuperación a <strong>{email}</strong>
            </p>
            
            <div style={{ 
              background: '#e3f2fd', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #2196f3'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1976d2' }}>
                <strong>📧 Verifica:</strong> Bandeja de entrada, spam o papelera<br/>
                <strong>⏰ Tiempo:</strong> El enlace expira en 1 hora<br/>
                <strong>🔐 Seguridad:</strong> Usa el enlace solo una vez
              </p>
            </div>

            <button
              type="button"
              className={styles.submitButton}
              onClick={() => navigate('/login')}
              style={{ 
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                marginBottom: '10px'
              }}
            >
              <FaArrowLeft style={{ marginRight: '8px' }} />
              Volver al Login
            </button>

            <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
              ¿No recibiste el email? 
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#2196f3', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Intentar nuevamente
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <FaEnvelope />
          </div>
            <h2>Olvidé mi Contraseña</h2>
            <p className={styles.authSubtitle}>Ingresa tu email para recibir un enlace de recuperación</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <FaEnvelope className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Ingresa tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <FaSpinner className={styles.spinner} />
                Enviando...
              </>
            ) : (
              'Enviar Enlace de Recuperación'
            )}
          </button>

          <button
            type="button"
            className={styles.submitButton}
            onClick={() => navigate('/login')}
            style={{ 
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              marginTop: '10px'
            }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Volver al Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
