import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import WelcomePopup from './components/WelcomePopup.jsx';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import styles from './App.module.css';

function App() {
  const { showWelcomePopup, closeWelcomePopup, user } = useAuth();

  return (
    <div className={styles.container}> 
      <ScrollToTop />
      <Toaster position="top-center" />
      <Navbar />
      <main className={styles.contentWrapper}>
        <Outlet />
      </main>
      <Footer />
      
      {/* Popup de boas-vindas para primeiro login */}
      <WelcomePopup 
        isVisible={showWelcomePopup}
        onClose={closeWelcomePopup}
        userName={user?.name}
      />
    </div>
  );
}

export default App;