import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css'; // Vamos criar este CSS
import { FaPlayCircle, FaFileAlt } from 'react-icons/fa';

function HomePage() {
  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>¡Bienvenido al Mundo Mágico!</h1>
      <p className={styles.subtitle}>¿Qué aventura quieres empezar hoy?</p>
      <div className={styles.selectionGrid}>
        <Link to="/videos" className={styles.selectionCard}>
          <FaPlayCircle className={styles.icon} />
          <h2>Videos Divertidos</h2>
        </Link>
        <Link to="/documentos" className={styles.selectionCard}>
          <FaFileAlt className={styles.icon} />
          <h2>Actividades para Imprimir</h2>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;