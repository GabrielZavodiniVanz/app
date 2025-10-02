import React from 'react';
import styles from './Footer.module.css';
import { FaEnvelope } from 'react-icons/fa';

function Footer() {
  const email = 'contactoninosdeluz@gmail.com';
  const subject = 'Contato a partir do Mundo Mágico';

  return (
    <footer className={styles.footer}>
      <p>Mundo Mágico © {new Date().getFullYear()} - Todos os direitos reservados.</p>
      
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