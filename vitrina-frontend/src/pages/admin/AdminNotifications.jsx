import { useState, useEffect, useCallback } from 'react'
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi'
import { notificationsAPI } from '../../services/api'
import { Spinner, EmptyState } from '../../components/common/UI'
import toast from 'react-hot-toast'

const TYPE_ICON = { pqrs:'📋', review:'⭐', account:'👤', system:'🔔' }

export default function AdminNotifications() {
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [unread,  setUnread]  = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    notificationsAPI.list()
      .then(r => { setNotifs(r.data.data.notifications); setUnread(r.data.data.unread) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    await notificationsAPI.markRead(id).catch(() => {})
    load()
  }

  const markAll = async () => {
    await notificationsAPI.markAll().catch(() => {})
    toast.success('Todas marcadas como leídas')
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-heading font-black text-primary">Notificaciones</h1>
          <p className="text-primary/50 font-body mt-1">{unread > 0 ? `${unread} sin leer` : 'Todo al día'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="btn-outline flex items-center gap-2 text-sm">
            <FiCheckCircle className="w-4 h-4" /> Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : notifs.length === 0 ? (
        <EmptyState icon={FiBell} title="Sin notificaciones" description="Cuando haya actividad aparecerá aquí." />
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-card-hover ${!n.is_read ? 'border-l-4 border-accent' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 text-xl">
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.is_read ? 'text-primary/60' : 'text-primary'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-primary/50 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-primary/30 mt-1">{new Date(n.created_at).toLocaleDateString('es-CO', { dateStyle:'medium' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
