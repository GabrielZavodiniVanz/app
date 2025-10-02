import React, { useState, useContext, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaBars, FaTimes, FaCaretDown, FaUser, FaVideo, FaFileAlt, FaCog, FaSignOutAlt, FaStar } from 'react-icons/fa';

function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false); // NOVO: Estado para o dropdown de admin
  const dropdownRef = useRef(null); // NOVO: Referência para o dropdown

  const handleLogout = () => {
    closeAllMenus();
    logout();
    navigate('/login');
  };
  
  const closeAllMenus = () => {
    setMenuOpen(false);
    setAdminMenuOpen(false);
  };

  // Efeito para fechar o dropdown de admin se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    }
    // Adiciona o listener quando o componente monta
    document.addEventListener("mousedown", handleClickOutside);
    // Remove o listener quando o componente desmonta
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className={styles.navbar}> 
      <NavLink to="/" className={styles.brand} onClick={closeAllMenus}>
        <FaStar className={styles.brandIcon} />
        <span className={styles.brandText}>Mundo Mágico</span>
      </NavLink>

      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <div className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
        {token ? (
          <>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                <FaUser />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.welcomeMessage}>¡Hola!</span>
                <span className={styles.userName}>{user?.name}</span>
              </div>
            </div>
            
            <NavLink to="/videos" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              <FaVideo className={styles.linkIcon} />
              <span>Videos</span>
            </NavLink>
            <NavLink to="/documentos" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              <FaFileAlt className={styles.linkIcon} />
              <span>Documentos</span>
            </NavLink>

            {/* ATUALIZADO: Lógica do Dropdown de Admin */}
            {user?.role === 'admin' && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <button 
                  className={styles.dropdownButton} 
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                >
                  <FaCog className={styles.linkIcon} />
                  <span>Admin</span>
                  <FaCaretDown className={`${styles.dropdownArrow} ${adminMenuOpen ? styles.rotated : ''}`} />
                </button>
                {adminMenuOpen && (
                  <div className={styles.dropdownContent}>
                    <NavLink to="/admin/videos" onClick={closeAllMenus} className={styles.dropdownItem}>
                      <FaVideo />
                      <span>Gerenciar Vídeos</span>
                    </NavLink>
                    <NavLink to="/admin/documentos" onClick={closeAllMenus} className={styles.dropdownItem}>
                      <FaFileAlt />
                      <span>Gerenciar Documentos</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={handleLogout} className={styles.logoutButton}>
              <FaSignOutAlt className={styles.linkIcon} />
              <span>Salir</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              <FaUser className={styles.linkIcon} />
              <span>Login</span>
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              <FaUser className={styles.linkIcon} />
              <span>Registrar</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;