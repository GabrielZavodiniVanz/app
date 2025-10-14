import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser({ 
          name: decodedUser.name, 
          role: decodedUser.role,
          firstLogin: decodedUser.firstLogin
        });
      } catch (e) {
        console.error("Token inválido ou expirado:", e);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setShowWelcomePopup(false);
      }
    } else {
      setUser(null);
      setShowWelcomePopup(false);
    }
  }, [token]);

  const login = (newToken, userData = null) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    
    // Se houver dados do usuário e for primeiro login, mostrar popup
    if (userData && userData.firstLogin) {
      setShowWelcomePopup(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setShowWelcomePopup(false);
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  const contextValue = { 
    user, 
    token, 
    login, 
    logout, 
    showWelcomePopup, 
    closeWelcomePopup
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};