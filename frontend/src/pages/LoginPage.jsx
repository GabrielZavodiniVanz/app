import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaSpinner } from 'react-icons/fa';
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
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
            <FaUser />
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
            ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;