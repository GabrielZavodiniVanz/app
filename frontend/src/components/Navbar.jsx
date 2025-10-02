import React, { useState, useContext, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaBars, FaTimes, FaCaretDown } from 'react-icons/fa';

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
        Mundo Mágico
      </NavLink>

      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <div className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
        {token ? (
          <>
            <span className={styles.welcomeMessage}>¡Hola, {user?.name}!</span>
            
            <NavLink to="/videos" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              Videos
            </NavLink>
            <NavLink to="/documentos" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              Documentos
            </NavLink>

            {/* ATUALIZADO: Lógica do Dropdown de Admin */}
            {user?.role === 'admin' && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <button 
                  className={styles.dropdownButton} 
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                >
                  Admin <FaCaretDown />
                </button>
                {adminMenuOpen && (
                  <div className={styles.dropdownContent}>
                    <NavLink to="/admin/videos" onClick={closeAllMenus}>
                      Gerenciar Vídeos
                    </NavLink>
                    <NavLink to="/admin/documentos" onClick={closeAllMenus}>
                      Gerenciar Documentos
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={handleLogout} className={styles.logoutButton}>
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? styles.activeLink : styles.link} onClick={closeAllMenus}>
              Registrar
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;