import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

function AdminRoute() {
  const { user, token } = useContext(AuthContext);

  // Se estiver carregando os dados do usuário, pode mostrar um spinner
  if (!user && token) {
    return <div>Carregando...</div>; 
  }

  // Se o usuário tiver token E for admin, permite o acesso
  if (token && user?.role === 'admin') {
    return <Outlet />; // Outlet renderiza as rotas filhas (ex: ManageVideosPage)
  }

  // Se não, redireciona para a página inicial
  return <Navigate to="/" replace />;
}

export default AdminRoute;