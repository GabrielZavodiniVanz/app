import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  if (!token) {
    // Se não houver token, redireciona o usuário para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se houver um token, mostra a página que o usuário queria acessar
  return children;
}

export default ProtectedRoute;