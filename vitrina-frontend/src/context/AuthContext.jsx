// ============================================================
//  context/AuthContext.jsx
//  Estado global de autenticación
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sesión al recargar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    authAPI.me()
      .then(res => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])
  const login = useCallback(async (email, password) => {
   const res  = await authAPI.login({ email, password })
   const { token, user } = res.data.data
   localStorage.setItem('token', token)
   localStorage.setItem('user', JSON.stringify(user))
   setUser(user)
    return user
}, [])
  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    setUser(prev => ({ ...prev, ...data }))
  }, [])

  const isAdmin       = user?.role === 'admin'
  const isEntrepreneur = user?.role === 'entrepreneur'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated, isAdmin, isEntrepreneur,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
