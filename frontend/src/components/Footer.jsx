import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { 
  FaEnvelope, 
  FaHeart,
  FaChild,
  FaHome,
  FaPlayCircle,
  FaFileAlt
} from 'react-icons/fa';

function Footer() {
  const email = 'contactoninosdeluz@gmail.com';
  const subject = 'Contato a partir do Mundo Mágico';

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Seção principal */}
        <div className={styles.mainSection}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <FaChild className={styles.logoIcon} />
              <h3>Niños de Luz</h3>
            </div>
            <p className={styles.description}>
              Creando un mundo mágico de aprendizaje y diversión para los más pequeños.
            </p>
          </div>

          <div className={styles.quickLinks}>
            <h4>Enlaces Rápidos</h4>
            <ul>
              <li>
                <FaHome className={styles.linkIcon} />
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <FaPlayCircle className={styles.linkIcon} />
                <Link to="/videos">Videos Educativos</Link>
              </li>
              <li>
                <FaFileAlt className={styles.linkIcon} />
                <Link to="/documentos">Documentos</Link>
              </li>
            </ul>
          </div>

          <div className={styles.contactInfo}>
            <h4>Contacto</h4>
            <div className={styles.contactItem}>
              <FaEnvelope className={styles.contactIcon} />
              <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>
                {email}
              </a>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className={styles.separator}></div>

        {/* Seção inferior */}
        <div className={styles.bottomSection}>
          <div className={styles.copyright}>
            <p>© {new Date().getFullYear()} Niños de Luz. Todos los derechos reservados.</p>
            <p className={styles.madeWith}>
              Hecho con <FaHeart className={styles.heartIcon} /> para los niños del mundo
            </p>
          </div>
          
          <div className={styles.legalLinks}>
            <a href="#privacy">Política de Privacidad</a>
            <span>•</span>
            <a href="#terms">Términos de Uso</a>
            <span>•</span>
            <a href="#cookies">Política de Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;