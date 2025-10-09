import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { loginUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext.jsx';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, token } = useContext(AuthContext);

  // NOVO: Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  // Fix para pontos de interrogação no mobile
  useEffect(() => {
    const removeValidationElements = () => {
      // Remover elementos de validação webkit
      const validationElements = document.querySelectorAll('::-webkit-validation-bubble, ::-webkit-validation-bubble-message, ::-webkit-validation-bubble-icon');
      validationElements.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Ocultar elementos de validação via CSS inline
      const inputs = document.querySelectorAll('.authContainer input');
      inputs.forEach(input => {
        if (input) {
          input.style.setProperty('-webkit-validation-bubble', 'none', 'important');
        }
      });
    };

    // Executar imediatamente e em intervalos
    removeValidationElements();
    const interval = setInterval(removeValidationElements, 100);
    
    // Limpar interval após 5 segundos
    setTimeout(() => clearInterval(interval), 5000);

    return () => clearInterval(interval);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Validação customizada antes de enviar
    if (!email.trim()) {
      setError('Por favor, ingresa tu email.');
      setIsLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor, ingresa tu contraseña.');
      setIsLoading(false);
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un email válido.');
      setIsLoading(false);
      return;
    }
    
    try {
      const receivedToken = await loginUser({ email, password });
      login(receivedToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <span style={{ fontSize: '2.5rem' }}>☀️</span>
          </div>
          <h2>Iniciar Sesión</h2>
          <p className={styles.authSubtitle}>¡Bienvenido de vuelta!</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <FaEnvelope className={styles.inputIcon} />
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? (
              <>
                <FaSpinner className={styles.spinner} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
          
        <p className={styles.switchMessage}>
          ¿Olvidaste tu contraseña? <Link to="/forgot-password">Recuperar contraseña</Link>
        </p>
        <p className={styles.switchMessage}>
          ¿Conoces tu contraseña? <Link to="/change-password">Cambiar contraseña</Link>
        </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;