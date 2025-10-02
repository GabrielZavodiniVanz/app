import { createBrowserRouter } from 'react-router-dom';

// Importa os Componentes de Layout e Proteção
import App from './App.jsx';
import AuthLayout from './components/AuthLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Importa as Páginas Comuns
import HomePage from './pages/HomePage.jsx';
import VideoPage from './pages/VideoPage.jsx';
import DocumentPage from './pages/DocumentPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Importa as Páginas da Área de Administração
import ManageVideosPage from './pages/admin/ManageVideosPage.jsx';
import VideoFormPage from './pages/admin/VideoFormPage.jsx';
import EditVideoPage from './pages/admin/EditVideoPage.jsx';
import ManageDocumentsPage from './pages/admin/ManageDocumentsPage.jsx';
import DocumentFormPage from './pages/admin/DocumentFormPage.jsx';
import EditDocumentPage from './pages/admin/EditDocumentPage.jsx';

// Criação e configuração de todas as rotas do aplicativo
const router = createBrowserRouter([
  {
    // --- GRUPO DE ROTAS PROTEGIDAS PARA USUÁRIOS ---
    // Exige login e usa o layout principal <App />
    path: "/",
    element: <ProtectedRoute><App /></ProtectedRoute>,
    children: [
      {
        index: true, 
        element: <HomePage />,
      },
      {
        path: "videos",
        element: <VideoPage />,
      },
      {
        path: "documentos",
        element: <DocumentPage />,
      },
    ],
  },
  {
    // --- GRUPO DE ROTAS PROTEGIDAS PARA ADMINISTRADORES ---
    // Exige login E o papel de 'admin' para acessar
    path: "/admin",
    element: <AdminRoute />,
    children: [
      // Rotas de Gerenciamento de Vídeos
      {
        path: "videos",
        element: <ManageVideosPage />,
      },
      {
        path: "videos/novo",
        element: <VideoFormPage />,
      },
      {
        path: "videos/editar/:id",
        element: <EditVideoPage />,
      },
      // Rotas de Gerenciamento de Documentos
      {
        path: "documentos",
        element: <ManageDocumentsPage />,
      },
      {
        path: "documentos/novo",
        element: <DocumentFormPage />,
      },
      {
        path: "documentos/editar/:id",
        element: <EditDocumentPage />,
      },
    ]
  },
  {
    // --- GRUPO DE ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
    // Usam o layout de autenticação (sem Navbar principal)
    element: <AuthLayout />,
    children: [
      { 
        path: "/login", 
        element: <LoginPage /> 
      },
      { 
        path: "/register", 
        element: <RegisterPage />
      },
    ]
  }
]);

export default router;