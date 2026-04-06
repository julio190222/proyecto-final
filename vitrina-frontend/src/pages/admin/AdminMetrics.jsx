import { useState, useEffect } from 'react'
import { FiBarChart2, FiFilter } from 'react-icons/fi'
import { analyticsAPI } from '../../services/api'
import { Spinner } from '../../components/common/UI'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#1d294a','#ffdd1a','#3b5998','#e8a838','#2d6e4e','#c0392b']

export default function AdminMetrics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (from) params.from = from
    if (to)   params.to   = to
    analyticsAPI.global(params)
      .then(r => setData(r.data.data))
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const m  = data?.metrics || {}
  const tp = data?.top_products  || []
  const tb = data?.top_businesses || []
  const bc = data?.by_category   || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">Métricas</h1>
        <p className="text-primary/50 font-body mt-1">Indicadores generales de la plataforma</p>
      </div>

      {/* Filtro de fechas */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div><label className="label text-xs">Desde</label><input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className="label text-xs">Hasta</label><input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} /></div>
        <button onClick={load} className="btn-primary flex items-center gap-2"><FiFilter className="w-4 h-4" />Filtrar</button>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); setTimeout(load, 100) }} className="btn-ghost text-sm">Limpiar</button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Emprendedores', value: m.total_entrepreneurs },
              { label:'Tiendas activas', value: m.active_businesses },
              { label:'Productos activos', value: m.active_products },
              { label:'Sesiones totales', value: m.total_sessions },
            ].map(({ label, value }) => (
              <div key={label} className="card p-5 text-center">
                <p className="text-3xl font-heading font-black text-primary">{value ?? '—'}</p>
                <p className="text-xs text-primary/50 mt-1 font-body">{label}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <p className="text-center text-primary/50 text-sm">Tiempo promedio en plataforma: <span className="font-bold text-primary">{Math.round(m.avg_duration_seconds || 0)}s</span></p>
          </div>

          {/* Gráfica por categoría */}
          {bc.length > 0 && (
            <div className="card p-6">
              <h2 className="text-h3 font-heading font-bold text-primary mb-4">Emprendimientos por categoría</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bc} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#1d294a99' }} />
                  <YAxis tick={{ fontSize:11, fill:'#1d294a99' }} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }} formatter={v => [v,'Negocios']} />
                  <Bar dataKey="total" radius={[6,6,0,0]}>
                    {bc.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top productos y negocios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-h3 font-heading font-bold text-primary mb-4">Productos más vistos</h2>
              {tp.length > 0 ? (
                <div className="space-y-3">
                  {tp.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-primary/30">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                        <p className="text-xs text-primary/40">{p.business}</p>
                      </div>
                      <span className="text-sm font-bold text-primary bg-accent/10 px-2 py-1 rounded-lg">{p.views}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-primary/30 text-sm text-center py-6">Sin datos</p>}
            </div>
            <div className="card p-6">
              <h2 className="text-h3 font-heading font-bold text-primary mb-4">Negocios más visitados</h2>
              {tb.length > 0 ? (
                <div className="space-y-3">
                  {tb.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-primary/30">{i+1}</span>
                      <p className="flex-1 text-sm font-semibold text-primary truncate">{b.name}</p>
                      <span className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">{b.visits}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-primary/30 text-sm text-center py-6">Sin datos</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
