import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import LoginPage from './pages/LoginPage.jsx';
import AshaDashboard from './pages/AshaDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import Layout from './components/Layout.jsx';

// Redirects to role-specific dashboard if already logged in
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ASHA') return <Navigate to="/asha" replace />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  return <Navigate to="/login" replace />;
}

// Guards a route — redirects to login if not authenticated
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/asha"
        element={
          <ProtectedRoute allowedRoles={['ASHA']}>
            <Layout>
              <AshaDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <Layout>
              <DoctorDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default: redirect based on role */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
