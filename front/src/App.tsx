import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Remitos from './pages/Remitos';
import RemitosViajante from './pages/RemitosViajante';
import RemitoDetalle from './pages/RemitoDetalle';
import NuevoRemito from './pages/NuevoRemito';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Inventario from './pages/Inventario';
import Recetas from './pages/Recetas';
import Informes from './pages/Informes';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && currentUser.rol !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="remitos" element={<Remitos />} />
        <Route path="mis-remitos" element={<RemitosViajante />} />
        <Route path="remitos/nuevo" element={<ProtectedRoute adminOnly><NuevoRemito /></ProtectedRoute>} />
        <Route path="remitos/:id" element={<RemitoDetalle />} />
        <Route path="productos" element={<ProtectedRoute adminOnly><Productos /></ProtectedRoute>} />
        <Route path="categorias" element={<ProtectedRoute adminOnly><Categorias /></ProtectedRoute>} />
        <Route path="inventario" element={<ProtectedRoute adminOnly><Inventario /></ProtectedRoute>} />
        <Route path="recetas" element={<ProtectedRoute adminOnly><Recetas /></ProtectedRoute>} />
        <Route path="informes" element={<ProtectedRoute adminOnly><Informes /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
