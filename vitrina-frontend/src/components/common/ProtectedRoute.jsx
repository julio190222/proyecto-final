// ============================================================
//  components/common/ProtectedRoute.jsx
//  Guards de rutas por rol
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// Requiere autenticación
export function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Solo admin
export function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

// Solo emprendedor
export function EntrepreneurRoute({ children }) {
  const { isEntrepreneur, isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isEntrepreneur) return <Navigate to="/" replace />
  if (user?.must_change_password) return <Navigate to="/change-password" replace />
  return children
}
