import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import { Toaster } from 'react-hot-toast';
import styles from '../App.module.css';

function AdminRoute() {
  const { user, token } = useContext(AuthContext);

  // Se estiver carregando os dados do usuário, pode mostrar um spinner
  if (!user && token) {
    return <div>Carregando...</div>; 
  }

  // Se o usuário tiver token E for admin, permite o acesso
  if (token && user?.role === 'admin') {
    return (
      <div className={styles.container}>
        <Toaster position="top-center" />
        <Navbar />
        <main className={styles.contentWrapper}>
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }

  // Se não, redireciona para a página inicial
  return <Navigate to="/" replace />;
}

export default AdminRoute;