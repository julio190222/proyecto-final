import { useState, useEffect } from 'react'
import { FiActivity, FiMessageCircle, FiStar, FiTrendingUp } from 'react-icons/fi'
import { analyticsAPI } from '../../services/api'
import { Spinner, StarRating } from '../../components/common/UI'

export default function EntMetrics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.myStore().then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const tp = data?.top_products || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">Mis métricas</h1>
        <p className="text-primary/50 font-body mt-1">Estadísticas de tu tienda</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiActivity,      label: 'Visitas totales',       value: data?.visits,          color: 'bg-primary' },
          { icon: FiMessageCircle, label: 'Clics en WhatsApp',     value: data?.whatsapp_clicks, color: 'bg-green-500' },
          { icon: FiStar,          label: 'Calificación promedio', value: data?.avg_rating ? Number(data.avg_rating).toFixed(1) : '—', color: 'bg-accent' },
          { icon: FiTrendingUp,    label: 'Total de reseñas',      value: data?.total_reviews,   color: 'bg-blue-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color} ${color === 'bg-accent' ? 'text-primary' : 'text-white'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-primary/50 text-sm">{label}</p>
              <p className="text-2xl font-heading font-black text-primary mt-0.5">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top productos */}
      <div className="card p-6">
        <h2 className="text-h3 font-heading font-bold text-primary mb-4">Tus productos más vistos</h2>
        {tp.length > 0 ? (
          <div className="space-y-3">
            {tp.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                </div>
                <div className="flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-xl">
                  <FiActivity className="w-3 h-3 text-primary/50" />
                  <span className="text-sm font-bold text-primary">{p.views}</span>
                  <span className="text-xs text-primary/40">vistas</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-primary/30 text-sm">Aún no hay datos de visitas a tus productos.</p>
            <p className="text-primary/20 text-xs mt-1">Los datos aparecen cuando los visitantes ven tu tienda.</p>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-accent/10 rounded-2xl p-5 border border-accent/20">
        <p className="text-sm font-semibold text-primary mb-1">💡 Consejo para mejorar tus métricas</p>
        <p className="text-sm text-primary/60">Mantén tus productos actualizados con buenas imágenes y descripciones detalladas. Los visitantes pasan más tiempo en tiendas con información completa.</p>
      </div>
    </div>
  )
}
