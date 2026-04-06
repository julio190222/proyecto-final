import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FiUsers, FiShoppingBag, FiMessageSquare, FiStar,
  FiTrendingUp, FiArrowRight, FiActivity, FiTag
} from 'react-icons/fi'
import { analyticsAPI, usersAPI, pqrsAPI, reviewsAPI } from '../../services/api'
import { Spinner, StarRating } from '../../components/common/UI'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#1d294a', '#ffdd1a', '#3b5998', '#e8a838', '#2d6e4e', '#c0392b']

function StatCard({ icon: Icon, label, value, sub, color = 'primary', to }) {
  const colors = {
    primary: 'bg-primary text-white',
    accent:  'bg-accent text-primary',
    green:   'bg-green-500 text-white',
    blue:    'bg-blue-500 text-white',
  }
  const card = (
    <div className="card p-6 flex items-start gap-4 group hover:shadow-card-hover transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-primary/50 text-sm font-body">{label}</p>
        <p className="text-2xl font-heading font-black text-primary mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-primary/40 mt-1 font-body">{sub}</p>}
      </div>
      {to && <FiArrowRight className="w-4 h-4 text-primary/20 group-hover:text-primary/60 transition-colors flex-shrink-0 mt-1" />}
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export default function AdminDashboard() {
  const [metrics,  setMetrics]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [pqrsCount, setPqrs]    = useState(0)

  useEffect(() => {
    Promise.all([
      analyticsAPI.global(),
      pqrsAPI.list({ status: 'pending', limit: 1 }),
    ]).then(([mRes, pRes]) => {
      setMetrics(mRes.data.data)
      setPqrs(pRes.data.meta?.total || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  const m = metrics?.metrics || {}
  const topProducts  = metrics?.top_products  || []
  const topBiz       = metrics?.top_businesses || []
  const byCategory   = metrics?.by_category   || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">Dashboard</h1>
        <p className="text-primary/50 font-body mt-1">Resumen general de la plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FiUsers}       label="Emprendedores"       value={m.total_entrepreneurs} sub={`${m.active_businesses} tiendas activas`} color="primary" to="/admin/usuarios" />
        <StatCard icon={FiShoppingBag} label="Productos activos"   value={m.active_products}     sub="En todas las tiendas"  color="accent"  />
        <StatCard icon={FiActivity}    label="Sesiones totales"    value={m.total_sessions}       sub={`Prom. ${Math.round(m.avg_duration_seconds || 0)}s por visita`} color="green" />
        <StatCard icon={FiMessageSquare} label="PQRS pendientes"   value={pqrsCount}              sub="Requieren atención"    color={pqrsCount > 0 ? 'primary' : 'blue'} to="/admin/pqrs" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Emprendimientos por categoría */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h3 font-heading font-bold text-primary">Por categoría</h2>
            <Link to="/admin/categorias" className="text-xs text-primary/40 hover:text-primary flex items-center gap-1 transition-colors">
              Gestionar <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#1d294a99' }} />
                <YAxis tick={{ fontSize: 11, fill: '#1d294a99' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(29,41,74,0.15)', fontSize: 12 }}
                  formatter={(v) => [v, 'Emprendimientos']}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-primary/30 text-sm">Sin datos aún</div>
          )}
        </div>

        {/* Distribución torta */}
        <div className="card p-6">
          <h2 className="text-h3 font-heading font-bold text-primary mb-6">Distribución de tiendas</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-primary/30 text-sm">Sin datos aún</div>
          )}
        </div>
      </div>

      {/* Top productos y negocios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Productos más vistos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-heading font-bold text-primary">Productos más vistos</h2>
            <FiTrendingUp className="w-5 h-5 text-accent" />
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary/50">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                    <p className="text-xs text-primary/40">{p.business}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg">
                    <FiActivity className="w-3 h-3 text-primary/40" />
                    <span className="text-xs font-bold text-primary">{p.views}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-primary/30 text-sm text-center py-8">Sin datos de visitas aún</p>
          )}
        </div>

        {/* Negocios más visitados */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-heading font-bold text-primary">Negocios más visitados</h2>
            <FiUsers className="w-5 h-5 text-accent" />
          </div>
          {topBiz.length > 0 ? (
            <div className="space-y-3">
              {topBiz.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{b.name}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-lg">
                    <FiActivity className="w-3 h-3 text-primary/60" />
                    <span className="text-xs font-bold text-primary">{b.visits}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-primary/30 text-sm text-center py-8">Sin datos de visitas aún</p>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card p-6">
        <h2 className="text-h3 font-heading font-bold text-primary mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/usuarios',   icon: FiUsers,         label: 'Nuevo emprendedor', color: 'bg-primary/5 hover:bg-primary/10' },
            { to: '/admin/categorias', icon: FiTag,           label: 'Categorías',        color: 'bg-accent/10 hover:bg-accent/20' },
            { to: '/admin/pqrs',       icon: FiMessageSquare, label: 'Ver PQRS',          color: 'bg-primary/5 hover:bg-primary/10' },
            { to: '/admin/resenas',    icon: FiStar,          label: 'Moderar reseñas',   color: 'bg-accent/10 hover:bg-accent/20' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${color} group`}>
              <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-primary text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
