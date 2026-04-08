import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiMessageCircle, FiStar, FiActivity, FiArrowRight, FiEdit2, FiExternalLink } from 'react-icons/fi'
import { analyticsAPI, businessAPI } from '../../services/api'
import { Spinner, StarRating } from '../../components/common/UI'

function StatCard({ icon: Icon, label, value, sub, color = 'primary', to }) {
  const colors = { primary:'bg-primary text-white', accent:'bg-accent text-primary', green:'bg-green-500 text-white', blue:'bg-blue-500 text-white' }
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

export default function EntDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [biz,     setBiz]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.myStore(), businessAPI.getMyBusiness()])
      .then(([mRes, bRes]) => { setMetrics(mRes.data.data); setBiz(bRes.data.data) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const tp = metrics?.top_products || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header con info de tienda */}
      <div className="card p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {biz?.logo_url
              ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-accent font-black text-2xl font-heading">{biz?.name?.[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-h2 font-heading font-black text-primary">{biz?.name}</h1>
            <p className="text-primary/50 text-sm mt-1 line-clamp-2">{biz?.description || 'Sin descripción aún'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className={`badge ${biz?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {biz?.status === 'active' ? 'Tienda activa' : 'Tienda inactiva'}
              </span>
              {metrics?.avg_rating > 0 && <StarRating rating={metrics.avg_rating} size="sm" />}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/mi-tienda/perfil" className="btn-outline flex items-center gap-2 text-sm py-2 px-4">
              <FiEdit2 className="w-4 h-4" /> Editar
            </Link>
            {biz?.slug && (
              <a href={`/tienda/${biz.slug}`} target="_blank" rel="noopener noreferrer"
                className="btn-accent flex items-center gap-2 text-sm py-2 px-4">
                <FiExternalLink className="w-4 h-4" /> Ver tienda
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FiActivity}      label="Visitas a tu tienda"   value={metrics?.visits}          sub="Total histórico"           color="primary" />
        <StatCard icon={FiMessageCircle} label="Clics en WhatsApp"     value={metrics?.whatsapp_clicks} sub="Contactos generados"        color="green" />
        <StatCard icon={FiStar}          label="Calificación promedio" value={metrics?.avg_rating ? Number(metrics.avg_rating).toFixed(1) : '—'} sub={`${metrics?.total_reviews || 0} reseñas`} color="accent" />
        <StatCard icon={FiShoppingBag}   label="Mis productos"         value={tp.length}                sub="Más vistos"  color="blue"  to="/mi-tienda/productos" />
      </div>

      {/* Top productos */}
      {tp.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-heading font-bold text-primary">Productos más vistos</h2>
            <Link to="/mi-tienda/productos" className="text-sm text-primary/40 hover:text-primary flex items-center gap-1 transition-colors">
              Ver todos <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {tp.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-primary">{i + 1}</span>
                </div>
                <p className="flex-1 text-sm font-semibold text-primary truncate">{p.name}</p>
                <span className="text-sm font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">{p.views} vistas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="card p-6">
        <h2 className="text-h3 font-heading font-bold text-primary mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to:'/mi-tienda/productos',     icon:FiShoppingBag,   label:'Mis productos',   color:'bg-primary/5 hover:bg-primary/10' },
            { to:'/mi-tienda/metricas',      icon:FiActivity,      label:'Mis métricas',    color:'bg-accent/10 hover:bg-accent/20' },
            { to:'/mi-tienda/pqrs',          icon:FiMessageCircle, label:'PQRS',            color:'bg-primary/5 hover:bg-primary/10' },
            { to:'/mi-tienda/notificaciones',icon:FiStar,          label:'Notificaciones',  color:'bg-accent/10 hover:bg-accent/20' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${color} group`}>
              <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-primary text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
