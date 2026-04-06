import { useState, useEffect } from 'react'
import { FiMessageSquare, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi'
import { pqrsAPI } from '../../services/api'
import { Spinner, EmptyState } from '../../components/common/UI'

const TYPE_MAP   = { petition:'Petición', complaint:'Queja', claim:'Reclamo', suggestion:'Sugerencia' }
const STATUS_MAP = { pending:'Pendiente', in_review:'En revisión', resolved:'Resuelto' }
const STATUS_CLS = { pending:'badge-warning', in_review:'badge-primary', resolved:'badge-success' }
const TYPE_CLS   = { petition:'badge-primary', complaint:'badge-danger', claim:'badge-danger', suggestion:'badge-accent' }

export default function EntPQRS() {
  const [pqrs,    setPqrs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pqrsAPI.myStore().then(r => setPqrs(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">PQRS de mi tienda</h1>
        <p className="text-primary/50 font-body mt-1">Solicitudes recibidas sobre tu negocio</p>
      </div>

      {loading ? <div className="flex justify-center h-48 items-center"><Spinner /></div>
      : pqrs.length === 0 ? (
        <EmptyState icon={FiMessageSquare} title="Sin PQRS" description="No has recibido solicitudes aún. Cuando lleguen aparecerán aquí." />
      ) : (
        <div className="space-y-3">
          {pqrs.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.status === 'resolved' ? 'bg-green-100' : p.status === 'in_review' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  {p.status === 'resolved' ? <FiCheck className="w-5 h-5 text-green-600" /> : p.status === 'in_review' ? <FiClock className="w-5 h-5 text-blue-600" /> : <FiAlertCircle className="w-5 h-5 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`badge ${TYPE_CLS[p.type]}`}>{TYPE_MAP[p.type]}</span>
                    <span className={`badge ${STATUS_CLS[p.status]}`}>{STATUS_MAP[p.status]}</span>
                  </div>
                  <p className="text-sm font-semibold text-primary">{p.name} · <span className="font-normal text-primary/40 text-xs">{p.email}</span></p>
                  <p className="text-sm text-primary/70 mt-2 leading-relaxed">{p.message}</p>
                  {p.admin_response && (
                    <div className="mt-3 p-3 bg-accent/10 rounded-xl border-l-4 border-accent">
                      <p className="text-xs font-bold text-primary/50 mb-1">Respuesta del administrador:</p>
                      <p className="text-sm text-primary/70">{p.admin_response}</p>
                    </div>
                  )}
                  <p className="text-xs text-primary/30 mt-2">{new Date(p.created_at).toLocaleDateString('es-CO', { dateStyle:'long' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
