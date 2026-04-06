import { useState, useEffect, useCallback } from 'react'
import { FiMessageSquare, FiCheck, FiClock, FiAlertCircle, FiSend } from 'react-icons/fi'
import { pqrsAPI } from '../../services/api'
import { Spinner, EmptyState, Pagination, Modal } from '../../components/common/UI'
import toast from 'react-hot-toast'

const TYPE_MAP    = { petition:'Petición', complaint:'Queja', claim:'Reclamo', suggestion:'Sugerencia' }
const STATUS_MAP  = { pending:'Pendiente', in_review:'En revisión', resolved:'Resuelto' }
const STATUS_CLS  = { pending:'badge-warning', in_review:'badge-primary', resolved:'badge-success' }
const TYPE_CLS    = { petition:'badge-primary', complaint:'badge-danger', claim:'badge-danger', suggestion:'badge-accent' }

function RespondModal({ pqrs, onSuccess, onClose }) {
  const [form, setForm] = useState({ admin_response: pqrs.admin_response || '', status: pqrs.status })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.admin_response) { toast.error('Escribe una respuesta'); return }
    setLoading(true)
    try {
      await pqrsAPI.respond(pqrs.id, form)
      toast.success('PQRS respondida correctamente')
      onSuccess()
    } catch { toast.error('Error al responder') } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Info del PQRS */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${TYPE_CLS[pqrs.type]}`}>{TYPE_MAP[pqrs.type]}</span>
          {pqrs.business_name && <span className="badge badge-primary">Tienda: {pqrs.business_name}</span>}
        </div>
        <p className="text-sm font-semibold text-primary">{pqrs.name} · <span className="font-normal text-primary/50">{pqrs.email}</span></p>
        <p className="text-sm text-primary/70 leading-relaxed">{pqrs.message}</p>
        <p className="text-xs text-primary/30">{new Date(pqrs.created_at).toLocaleDateString('es-CO', { dateStyle:'long' })}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tu respuesta *</label>
          <textarea className="input resize-none h-28" value={form.admin_response} onChange={e => setForm(p=>({...p,admin_response:e.target.value}))} placeholder="Escribe la respuesta al usuario..." />
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}>
            <option value="pending">Pendiente</option>
            <option value="in_review">En revisión</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</> : <><FiSend className="w-4 h-4" />Responder</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminPQRS() {
  const [pqrs,      setPqrs]    = useState([])
  const [loading,   setLoading] = useState(true)
  const [page,      setPage]    = useState(1)
  const [meta,      setMeta]    = useState(null)
  const [filter,    setFilter]  = useState({ status: '', type: '' })
  const [selected,  setSelected]= useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 10 }
    if (filter.status) params.status = filter.status
    if (filter.type)   params.type   = filter.type
    pqrsAPI.list(params)
      .then(r => { setPqrs(r.data.data); setMeta(r.data.meta) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">PQRS</h1>
        <p className="text-primary/50 font-body mt-1">Peticiones, quejas, reclamos y sugerencias</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={filter.status} onChange={e => { setFilter(p=>({...p,status:e.target.value})); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_review">En revisión</option>
          <option value="resolved">Resueltos</option>
        </select>
        <select className="input w-auto" value={filter.type} onChange={e => { setFilter(p=>({...p,type:e.target.value})); setPage(1) }}>
          <option value="">Todos los tipos</option>
          <option value="petition">Petición</option>
          <option value="complaint">Queja</option>
          <option value="claim">Reclamo</option>
          <option value="suggestion">Sugerencia</option>
        </select>
        {(filter.status || filter.type) && (
          <button onClick={() => { setFilter({ status:'', type:'' }); setPage(1) }} className="btn-ghost text-sm">Limpiar filtros</button>
        )}
        {meta && <span className="text-sm text-primary/40 self-center">{meta.total} resultado{meta.total !== 1 ? 's' : ''}</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : pqrs.length === 0 ? (
        <EmptyState icon={FiMessageSquare} title="No hay PQRS" description="Cuando los usuarios envíen solicitudes aparecerán aquí." />
      ) : (
        <div className="space-y-3">
          {pqrs.map(p => (
            <div key={p.id} className="card p-5 hover:shadow-card-hover transition-all cursor-pointer" onClick={() => setSelected(p)}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.status === 'resolved' ? 'bg-green-100' : p.status === 'in_review' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  {p.status === 'resolved' ? <FiCheck className="w-5 h-5 text-green-600" /> : p.status === 'in_review' ? <FiClock className="w-5 h-5 text-blue-600" /> : <FiAlertCircle className="w-5 h-5 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge ${TYPE_CLS[p.type]}`}>{TYPE_MAP[p.type]}</span>
                    <span className={`badge ${STATUS_CLS[p.status]}`}>{STATUS_MAP[p.status]}</span>
                    {p.business_name && <span className="badge badge-primary">Tienda: {p.business_name}</span>}
                  </div>
                  <p className="font-semibold text-primary text-sm">{p.name} · <span className="font-normal text-primary/50 text-xs">{p.email}</span></p>
                  <p className="text-sm text-primary/60 mt-1 line-clamp-2">{p.message}</p>
                  {p.admin_response && (
                    <div className="mt-2 pl-3 border-l-2 border-accent">
                      <p className="text-xs text-primary/50 line-clamp-1">Respuesta: {p.admin_response}</p>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-primary/30">{new Date(p.created_at).toLocaleDateString('es-CO')}</p>
                  <button className="mt-2 text-xs font-semibold text-primary/50 hover:text-primary transition-colors">
                    {p.status === 'resolved' ? 'Ver respuesta' : 'Responder →'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={meta?.pages || 1} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Responder PQRS" size="md">
        {selected && <RespondModal pqrs={selected} onSuccess={() => { setSelected(null); load() }} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  )
}
