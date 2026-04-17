// ============================================================
//  components/layout/AdminLayout.jsx
//  Layout del panel administrativo con sidebar
// ============================================================

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiHome, FiUsers, FiTag, FiStar, FiMessageSquare,
  FiBarChart2, FiBell, FiLogOut, FiMenu, FiX, FiShield, FiExternalLink
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/admin',               icon: FiHome,          label: 'Dashboard',       end: true },
  { to: '/admin/usuarios',      icon: FiUsers,         label: 'Usuarios' },
  { to: '/admin/categorias',    icon: FiTag,           label: 'Categorías' },
  { to: '/admin/resenas',       icon: FiStar,          label: 'Reseñas' },
  { to: '/admin/pqrs',          icon: FiMessageSquare, label: 'PQRS' },
  { to: '/admin/metricas',      icon: FiBarChart2,     label: 'Métricas' },
  { to: '/admin/notificaciones',icon: FiBell,          label: 'Notificaciones' },
  { to: '/',                    icon: FiExternalLink,  label: 'Ver sitio' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [open, setOpen]  = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-primary w-64 flex-shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <FiShield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">Panel Admin</p>
            <p className="text-white/50 text-xs font-body truncate max-w-[140px]">{user?.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-item-inactive w-full">
          <FiLogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex animate-slide-up">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-primary hover:bg-gray-100">
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-primary font-black text-sm">V</span>
            </div>
            <span className="font-heading font-bold text-primary text-sm">Panel Admin</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Contenido con scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
