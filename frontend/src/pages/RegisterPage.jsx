import React, { useState, useContext, useEffect } from 'react'; // Adicione useContext e useEffect
import { Link, useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { registerUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext.jsx'; // NOVO

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { token } = useContext(AuthContext); // NOVO

  // NOVO: Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await registerUser({ name, email, password });
      toast.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error en el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // O JSX do formulário continua o mesmo
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Crear una Cuenta</h2>
        <div className={styles.inputGroup}>
          <FaUser className={styles.inputIcon} />
          <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.inputGroup}>
          <FaEnvelope className={styles.inputIcon} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={styles.inputGroup}>
          <FaLock className={styles.inputIcon} />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>
        <p className={styles.switchMessage}>
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;