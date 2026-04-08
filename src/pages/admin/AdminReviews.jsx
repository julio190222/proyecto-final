import { useState, useEffect, useCallback } from 'react'
import { FiStar, FiEye, FiEyeOff } from 'react-icons/fi'
import { reviewsAPI } from '../../services/api'
import { Spinner, EmptyState, Pagination, StarRating } from '../../components/common/UI'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [meta,    setMeta]    = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    reviewsAPI.list({ page, limit: 12 })
      .then(r => { setReviews(r.data.data); setMeta(r.data.meta) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const toggleVisibility = async (r) => {
    try {
      await reviewsAPI.toggleVisibility(r.id, !r.is_visible)
      toast.success(r.is_visible ? 'Reseña ocultada' : 'Reseña publicada')
      load()
    } catch { toast.error('Error al actualizar reseña') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-heading font-black text-primary">Reseñas</h1>
        <p className="text-primary/50 font-body mt-1">Modera los comentarios de los visitantes</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={FiStar} title="Sin reseñas" description="Aún no hay calificaciones en la plataforma." />
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={`card p-5 transition-all ${!r.is_visible ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">{r.reviewer_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-primary text-sm">{r.reviewer_name}</p>
                      <p className="text-xs text-primary/40">{r.business_name}{r.product_name ? ` · ${r.product_name}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={r.rating} size="sm" showValue={false} />
                      <span className={`badge ${r.is_visible ? 'badge-success' : 'badge-danger'}`}>
                        {r.is_visible ? 'Visible' : 'Oculta'}
                      </span>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-primary/70 mt-2 leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-primary/30 mt-2">{new Date(r.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
                </div>
                <button onClick={() => toggleVisibility(r)}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${r.is_visible ? 'text-green-600 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}
                  title={r.is_visible ? 'Ocultar reseña' : 'Publicar reseña'}>
                  {r.is_visible ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={meta?.pages || 1} onPageChange={setPage} />
    </div>
  )
}
