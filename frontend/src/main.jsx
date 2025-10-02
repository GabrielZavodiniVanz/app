import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

// Importa o provedor de autenticação que criamos
import { AuthProvider } from './context/AuthContext.jsx'; 

// Importa a configuração do roteador que movemos para um arquivo separado
import router from './router.jsx'; 

// Importa o CSS global
import './index.css';

// Renderiza a aplicação
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O AuthProvider agora envolve o RouterProvider */}
    {/* Isso garante que todas as páginas e componentes tenham acesso ao estado de login */}
    <AuthProvider> 
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);