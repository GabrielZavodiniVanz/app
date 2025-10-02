import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { Toaster } from 'react-hot-toast'; // NOVO
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.container}> 
      <Toaster position="top-center" /> {/* NOVO: Componente que exibe as notificações */}
      <Navbar />
      <main className={styles.contentWrapper}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;