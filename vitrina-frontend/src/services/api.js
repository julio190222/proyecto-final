// ============================================================
//  services/api.js
//  Instancia de Axios con interceptores de autenticación
// ============================================================

import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — agrega token JWT ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — manejo global de errores ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message || 'Error de conexión'

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status === 403 && error.response?.data?.must_change_password) {
      window.location.href = '/change-password'
      return Promise.reject(error)
    }

    if (status === 403) toast.error('No tienes permiso para realizar esta acción')
    if (status === 404) toast.error('Recurso no encontrado')
    if (status === 409) toast.error(message)
    if (status === 422) toast.error(message)
    if (status >= 500) toast.error('Error del servidor. Intenta nuevamente.')

    return Promise.reject(error)
  }
)

export default api

// ── Servicios agrupados por módulo ───────────────────────────

export const authAPI = {
  login:          (data)   => api.post('/auth/login', data),
  me:             ()       => api.get('/auth/me'),
  changePassword: (data)   => api.post('/auth/change-password', data),
  logout:         ()       => api.post('/auth/logout'),
  resetPassword:  (userId) => api.post(`/auth/reset-password/${userId}`),
}

export const publicAPI = {
  getBusinesses:   (params) => api.get('/public/businesses', { params }),
  getBusiness:     (slug)   => api.get(`/public/businesses/${slug}`),
  getCategories:   ()       => api.get('/public/categories'),
  getSimilar:      (id)     => api.get(`/public/similar/${id}`),
  compare:         (ids)    => api.get('/products/compare', { params: { ids } }),
}

export const usersAPI = {
  list:           (params) => api.get('/users', { params }),
  getOne:         (id)     => api.get(`/users/${id}`),
  create:         (data)   => api.post('/users', data),
  update:         (id, data) => api.put(`/users/${id}`, data),
  toggleStatus:   (id, is_active) => api.patch(`/users/${id}/status`, { is_active }),
}

export const businessAPI = {
  getMyBusiness:  ()       => api.get('/businesses/me'),
  updateMyBiz:    (data)   => api.put('/businesses/me', data),
  uploadLogo:     (form)   => api.post('/businesses/me/logo',    form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCover:    (form)   => api.post('/businesses/me/cover',   form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadGallery:  (form)   => api.post('/businesses/me/gallery', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCatalog:  (form)   => api.post('/businesses/me/catalog', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listAll:        ()       => api.get('/businesses'),
}

export const productsAPI = {
  list:           (params)       => api.get('/products', { params }),
  create:         (data)         => api.post('/products', data),
  update:         (id, data)     => api.put(`/products/${id}`, data),
  remove:         (id)           => api.delete(`/products/${id}`),
  uploadImages:   (id, form)     => api.post(`/products/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getVariants:    (id)           => api.get(`/products/${id}/variants`),
  addVariant:     (id, data)     => api.post(`/products/${id}/variants`, data),
  updateVariant:  (id, vid, data)=> api.put(`/products/${id}/variants/${vid}`, data),
  removeVariant:  (id, vid)      => api.delete(`/products/${id}/variants/${vid}`),
}

export const categoriesAPI = {
  list:    ()         => api.get('/categories'),
  create:  (data)     => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  remove:  (id)       => api.delete(`/categories/${id}`),
}

export const reviewsAPI = {
  create:         (data)      => api.post('/reviews', data),
  list:           (params)    => api.get('/reviews', { params }),
  toggleVisibility: (id, is_visible) => api.patch(`/reviews/${id}/visibility`, { is_visible }),
}

export const pqrsAPI = {
  create:       (data)   => api.post('/pqrs', data),
  list:         (params) => api.get('/pqrs', { params }),
  myStore:      ()       => api.get('/pqrs/my-store'),
  respond:      (id, data) => api.patch(`/pqrs/${id}/respond`, data),
}

export const analyticsAPI = {
  event:    (data)   => api.post('/analytics/event', data),
  global:   (params) => api.get('/analytics/global', { params }),
  myStore:  ()       => api.get('/analytics/my-store'),
}

export const notificationsAPI = {
  list:     ()   => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAll:  ()   => api.patch('/notifications/read-all'),
}

export const searchAPI = {
  search: (q, type = 'all') => api.get('/search', { params: { q, type } }),
}
