// ============================================================
//  components/common/UI.jsx
//  Componentes de UI reutilizables en toda la app
// ============================================================

import { FiStar, FiLoader, FiInbox, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

// ── Calificación con estrellas ───────────────────────────────
export function StarRating({ rating = 0, max = 5, size = 'sm', showValue = true }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1">
      {stars.map(s => (
        <FiStar
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? 'text-accent fill-accent' : 'text-gray-300'}`}
        />
      ))}
      {showValue && (
        <span className="text-sm font-semibold text-primary/70 ml-1">
          {rating > 0 ? Number(rating).toFixed(1) : '—'}
        </span>
      )}
    </div>
  )
}

// ── Badge de stock ───────────────────────────────────────────
export function StockBadge({ status }) {
  const map = {
    available:   { label: 'Disponible',      cls: 'stock-available' },
    low_stock:   { label: 'Pocas unidades',  cls: 'stock-low' },
    out_of_stock:{ label: 'Agotado',         cls: 'stock-out' },
  }
  const { label, cls } = map[status] || map.available
  return <span className={cls}>{label}</span>
}

// ── Badge "Nuevo" ────────────────────────────────────────────
export function NewBadge() {
  return (
    <span className="badge bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
      Nuevo
    </span>
  )
}

// ── Spinner de carga ─────────────────────────────────────────
export function Spinner({ size = 'md', color = 'primary' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const colors = { primary: 'border-primary', white: 'border-white', accent: 'border-accent' }
  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  )
}

// ── Estado vacío ─────────────────────────────────────────────
export function EmptyState({ icon: Icon = FiInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary/30" />
      </div>
      <h3 className="text-h3 font-heading text-primary font-semibold mb-2">{title}</h3>
      {description && <p className="text-primary/50 text-sm max-w-sm font-body">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Paginación ───────────────────────────────────────────────
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-200 text-primary disabled:opacity-30 hover:bg-primary hover:text-white hover:border-primary transition-all"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>

      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
              p === page
                ? 'bg-primary text-white shadow-card'
                : 'border border-gray-200 text-primary hover:bg-primary/5'
            }`}
          >
            {p}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-lg border border-gray-200 text-primary disabled:opacity-30 hover:bg-primary hover:text-white hover:border-primary transition-all"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// ── Modal base ───────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-slide-up max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-h3 font-heading font-bold text-primary">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-primary/50 hover:text-primary transition-colors">
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Skeleton card ────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
