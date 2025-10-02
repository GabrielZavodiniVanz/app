import React, { useState, useContext, useEffect } from 'react'; // Adicione useEffect
import { Link, useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { loginUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext.jsx';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
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
    try {
      const receivedToken = await loginUser({ email, password });
      login(receivedToken);
      
      // MUDANÇA PRINCIPAL: Substitui a página de login no histórico
      navigate('/', { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Iniciar Sesión</h2>
        {/* Usamos o estado de erro aqui, não o toast, para feedback imediato no formulário */}
        {error && <p className={styles.error}>{error}</p>}
        
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
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className={styles.submitButton}>Entrar</button>
        
        <p className={styles.switchMessage}>
          ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;