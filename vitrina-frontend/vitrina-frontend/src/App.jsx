// ============================================================
//  App.jsx — Definición de rutas
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute, AdminRoute, EntrepreneurRoute } from './components/common/ProtectedRoute'

// ── Layouts ──────────────────────────────────────────────────
import AdminLayout       from './components/layout/AdminLayout'
import EntrepreneurLayout from './components/layout/EntrepreneurLayout'

// ── Páginas públicas ─────────────────────────────────────────
import HomePage          from './pages/public/HomePage'
import BusinessPage      from './pages/public/BusinessPage'
import CategoriesPage    from './pages/public/CategoriesPage'
import SearchPage        from './pages/public/SearchPage'
import LoginPage         from './pages/public/LoginPage'
import ChangePasswordPage from './pages/public/ChangePasswordPage'
import NotFoundPage      from './pages/public/NotFoundPage'

// ── Páginas admin ─────────────────────────────────────────────
import AdminDashboard    from './pages/admin/AdminDashboard'
import AdminUsers        from './pages/admin/AdminUsers'
import AdminCategories   from './pages/admin/AdminCategories'
import AdminReviews      from './pages/admin/AdminReviews'
import AdminPQRS         from './pages/admin/AdminPQRS'
import AdminMetrics      from './pages/admin/AdminMetrics'
import AdminNotifications from './pages/admin/AdminNotifications'

// ── Páginas emprendedor ───────────────────────────────────────
import EntDashboard      from './pages/entrepreneur/EntDashboard'
import EntProducts       from './pages/entrepreneur/EntProducts'
import EntMetrics        from './pages/entrepreneur/EntMetrics'
import EntPQRS           from './pages/entrepreneur/EntPQRS'
import EntNotifications  from './pages/entrepreneur/EntNotifications'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(29,41,74,0.15)',
            },
            success: { iconTheme: { primary: '#1d294a', secondary: '#ffdd1a' } },
          }}
        />

        <Routes>
          {/* ── Públicas ────────────────────────────────── */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/tienda/:slug"  element={<BusinessPage />} />
          <Route path="/categorias"    element={<CategoriesPage />} />
          <Route path="/buscar"        element={<SearchPage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/change-password" element={
            <PrivateRoute><ChangePasswordPage /></PrivateRoute>
          } />

          {/* ── Admin ───────────────────────────────────── */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/usuarios" element={
            <AdminRoute>
              <AdminLayout><AdminUsers /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/categorias" element={
            <AdminRoute>
              <AdminLayout><AdminCategories /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/resenas" element={
            <AdminRoute>
              <AdminLayout><AdminReviews /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/pqrs" element={
            <AdminRoute>
              <AdminLayout><AdminPQRS /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/metricas" element={
            <AdminRoute>
              <AdminLayout><AdminMetrics /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/notificaciones" element={
            <AdminRoute>
              <AdminLayout><AdminNotifications /></AdminLayout>
            </AdminRoute>
          } />

          {/* ── Emprendedor ──────────────────────────────── */}
          <Route path="/mi-tienda" element={
            <EntrepreneurRoute>
              <EntrepreneurLayout><EntDashboard /></EntrepreneurLayout>
            </EntrepreneurRoute>
          } />
          <Route path="/mi-tienda/productos" element={
            <EntrepreneurRoute>
              <EntrepreneurLayout><EntProducts /></EntrepreneurLayout>
            </EntrepreneurRoute>
          } />
          <Route path="/mi-tienda/metricas" element={
            <EntrepreneurRoute>
              <EntrepreneurLayout><EntMetrics /></EntrepreneurLayout>
            </EntrepreneurRoute>
          } />
          <Route path="/mi-tienda/pqrs" element={
            <EntrepreneurRoute>
              <EntrepreneurLayout><EntPQRS /></EntrepreneurLayout>
            </EntrepreneurRoute>
          } />
          <Route path="/mi-tienda/notificaciones" element={
            <EntrepreneurRoute>
              <EntrepreneurLayout><EntNotifications /></EntrepreneurLayout>
            </EntrepreneurRoute>
          } />

          {/* ── 404 ─────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
