import React from 'react';
import styles from './Footer.module.css';
import { FaEnvelope } from 'react-icons/fa';

function Footer() {
  const email = 'contactoninosdeluz@gmail.com';
  const subject = 'Contato a partir do Mundo Mágico';

  return (
    <footer className={styles.footer}>
      <p>Niños de Luz © {new Date().getFullYear()} - Reservados todos los derechos.</p>
      
      <div className={styles.contactLink}>
        <FaEnvelope />
        <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>
          {email}
        </a>
      </div>
    </footer>
  );
}

export default Footer;