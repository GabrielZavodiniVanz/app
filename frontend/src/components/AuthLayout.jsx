import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from '../App.module.css'; // Reutilizamos o estilo principal

function AuthLayout() {
  return (
    // Usamos a mesma seção de céu e as nuvens do App.jsx
    <div className={styles.skySection}>
      <img src="/images/cloud1.png" alt="" className={styles.cloud1} />
      <img src="/images/cloud2.png" alt="" className={styles.cloud2} />
      
      {/* Outlet renderizará a página de Login ou Registro aqui dentro */}
      <Outlet /> 
    </div>
  );
}

export default AuthLayout;