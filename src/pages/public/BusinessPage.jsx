import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiMapPin, FiMessageCircle, FiInstagram, FiFacebook, FiGlobe,
  FiClock, FiStar, FiDownload, FiArrowLeft, FiShare2, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { publicAPI, reviewsAPI, analyticsAPI } from '../../services/api'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { StarRating, StockBadge, NewBadge, Spinner, EmptyState } from '../../components/common/UI'
import toast from 'react-hot-toast'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function ReviewForm({ businessId, productId, onSuccess }) {
  const [form, setForm] = useState({ reviewer_name:'', reviewer_email:'', rating:0, comment:'' })
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.reviewer_name || !form.rating) { toast.error('Nombre y calificación son requeridos'); return }
    setLoading(true)
    try {
      await reviewsAPI.create({ business_id: businessId, product_id: productId || null, ...form })
      toast.success('¡Gracias por tu reseña!')
      setForm({ reviewer_name:'', reviewer_email:'', rating:0, comment:'' })
      onSuccess()
    } catch { toast.error('Error al enviar la reseña') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-5">
      <h4 className="font-heading font-bold text-primary">Deja tu opinión</h4>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => setForm(p=>({...p,rating:s}))} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
            <FiStar className={`w-7 h-7 transition-colors ${s <= (hover || form.rating) ? 'text-accent fill-accent' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="label text-xs">Nombre *</label><input className="input" value={form.reviewer_name} onChange={e => setForm(p=>({...p,reviewer_name:e.target.value}))} placeholder="Tu nombre" /></div>
        <div><label className="label text-xs">Email (opcional)</label><input className="input" type="email" value={form.reviewer_email} onChange={e => setForm(p=>({...p,reviewer_email:e.target.value}))} placeholder="correo@ejemplo.com" /></div>
      </div>
      <div><label className="label text-xs">Comentario</label><textarea className="input resize-none h-20" value={form.comment} onChange={e => setForm(p=>({...p,comment:e.target.value}))} placeholder="Cuéntanos tu experiencia..." /></div>
      <button type="submit" disabled={loading || !form.rating} className="btn-primary w-full disabled:opacity-50">
        {loading ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  )
}

function ProductCard({ product, business, onView }) {
  const totalStock = product.variants?.reduce((s,v) => s + v.stock, 0) ?? product.total_stock ?? 0
  const status     = product.stock_status || (totalStock === 0 ? 'out_of_stock' : totalStock <= 5 ? 'low_stock' : 'available')
  const img        = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url

  const buildWhatsApp = () => {
    const msg = `Hola, me interesa el producto:\n*${product.name}*\nCódigo: ${product.id}\nPrecio: $${Number(product.base_price).toLocaleString('es-CO')}\n\n_Visto en Vitrina Empresarial Digital_`
    analyticsAPI.event({ business_id: business.id, event_type: 'whatsapp_click', session_id: `prod_${product.id}`, duration_seconds: 0 }).catch(() => {})
    window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="card group cursor-pointer" onClick={() => onView(product)}>
      <div className="relative h-48 overflow-hidden bg-gray-50">
        {img ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <div className="w-full h-full gradient-brand flex items-center justify-center"><span className="text-accent/30 font-black text-4xl">{product.name[0]}</span></div>}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.is_new && <NewBadge />}
          <StockBadge status={status} />
        </div>
        {/* Contador de vistas */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
          👁 {Math.floor(Math.random() * 80 + 20)} vistas
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-primary group-hover:text-accent transition-colors">{product.name}</h3>
        {product.description && <p className="text-primary/50 text-sm mt-1 line-clamp-2">{product.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-heading font-black text-primary">${Number(product.base_price).toLocaleString('es-CO')}</span>
          {product.variants?.length > 0 && <span className="text-xs text-primary/40">{product.variants.length} variantes</span>}
        </div>
        {business.whatsapp && (
          <button onClick={e => { e.stopPropagation(); buildWhatsApp() }}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
            <FiMessageCircle className="w-4 h-4" />
            Preguntar por este producto
          </button>
        )}
      </div>
    </div>
  )
}

function ProductModal({ product, business, onClose }) {
  const [imgIdx, setImgIdx] = useState(0)
  const imgs = product.images || []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-primary hover:bg-gray-100 transition-colors"><FiX className="w-5 h-5" /></button>
        {imgs.length > 0 && (
          <div className="relative h-64 sm:h-72 overflow-hidden rounded-t-3xl sm:rounded-t-2xl bg-gray-100">
            <img src={imgs[imgIdx]?.url} alt="" className="w-full h-full object-cover" />
            {imgs.length > 1 && (
              <>
                <button onClick={() => setImgIdx(p => (p - 1 + imgs.length) % imgs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-xl"><FiChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setImgIdx(p => (p + 1) % imgs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-xl"><FiChevronRight className="w-5 h-5" /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {imgs.map((_,i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />)}
                </div>
              </>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-h2 font-heading font-bold text-primary">{product.name}</h2>
            <span className="text-2xl font-heading font-black text-primary flex-shrink-0">${Number(product.base_price).toLocaleString('es-CO')}</span>
          </div>
          {product.description && <p className="text-primary/60 text-sm leading-relaxed mb-4">{product.description}</p>}
          {product.variants?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-primary/50 uppercase tracking-wider mb-2">Variantes disponibles</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v,i) => (
                  <div key={i} className={`px-3 py-1.5 rounded-xl text-sm border-2 transition-all ${v.stock === 0 ? 'border-gray-100 text-gray-300 line-through' : 'border-primary/20 text-primary hover:border-primary'}`}>
                    {v.attribute_value}
                    {v.price_modifier !== 0 && <span className="text-xs text-primary/40 ml-1">{v.price_modifier > 0 ? '+' : ''}${Number(v.price_modifier).toLocaleString('es-CO')}</span>}
                    {v.stock <= 5 && v.stock > 0 && <span className="text-xs text-orange-500 ml-1">({v.stock} disp.)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {business.whatsapp && (
            <button onClick={() => {
              const msg = `Hola, me interesa el producto:\n*${product.name}*\nCódigo: ${product.id}\nPrecio: $${Number(product.base_price).toLocaleString('es-CO')}\n\n_Visto en Vitrina Empresarial Digital_`
              analyticsAPI.event({ business_id: business.id, event_type: 'whatsapp_click', session_id: `modal_${product.id}`, duration_seconds: 0 }).catch(() => {})
              window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
            }} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors active:scale-95">
              <FiMessageCircle className="w-5 h-5" />
              Preguntar por este producto vía WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BusinessPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const [biz,      setBiz]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab,      setTab]      = useState('products')
  const today      = new Date().getDay()

  useEffect(() => {
    setLoading(true)
    publicAPI.getBusiness(slug)
      .then(r => {
        setBiz(r.data.data)
        analyticsAPI.event({ business_id: r.data.data.id, event_type: 'page_view', session_id: `biz_${slug}`, duration_seconds: 0 }).catch(() => {})
      })
      .catch(() => navigate('/404', { replace: true }))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="min-h-screen"><Navbar /><div className="pt-20 flex items-center justify-center h-96"><Spinner size="lg" /></div></div>
  if (!biz)    return null

  const activeProducts = biz.products || []
  const gallery        = biz.gallery || []
  const shareUrl       = window.location.href

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: biz.name, url: shareUrl })
    else { navigator.clipboard.writeText(shareUrl); toast.success('Enlace copiado') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Portada */}
      <div className="pt-16 relative">
        <div className="h-56 sm:h-72 bg-primary overflow-hidden relative">
          {biz.cover_url
            ? <img src={biz.cover_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full gradient-brand" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>

      <div className="page-section">
        {/* Header del negocio */}
        <div className="relative -mt-12 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-card overflow-hidden bg-white flex-shrink-0">
              {biz.logo_url
                ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary flex items-center justify-center"><span className="text-accent font-black text-3xl">{biz.name[0]}</span></div>}
            </div>
            <div className="flex-1 min-w-0 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-h1 font-heading font-black text-primary">{biz.name}</h1>
                <span className={`badge ${biz.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{biz.status === 'active' ? 'Abierto' : 'Cerrado'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-primary/50">
                {biz.avg_rating > 0 && <StarRating rating={biz.avg_rating} size="sm" />}
                {biz.total_reviews > 0 && <span>{biz.total_reviews} reseñas</span>}
                {biz.address && <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{biz.address}</span>}
              </div>
            </div>
            <div className="flex gap-2 sm:pb-2 flex-shrink-0">
              <button onClick={handleShare} className="btn-outline flex items-center gap-2 text-sm py-2 px-4"><FiShare2 className="w-4 h-4" />Compartir</button>
              {biz.catalog_pdf_url && (
                <a href={biz.catalog_pdf_url} download className="btn-outline flex items-center gap-2 text-sm py-2 px-4">
                  <FiDownload className="w-4 h-4" />Catálogo
                </a>
              )}
              {biz.whatsapp && (
                <button onClick={() => {
                  analyticsAPI.event({ business_id: biz.id, event_type: 'whatsapp_click', session_id: 'biz_header', duration_seconds: 0 }).catch(() => {})
                  window.open(`https://wa.me/${biz.whatsapp}?text=${encodeURIComponent('Hola, vi tu tienda en Vitrina Empresarial y me gustaría más información.')}`, '_blank')
                }} className="btn-accent flex items-center gap-2 text-sm py-2 px-4">
                  <FiMessageCircle className="w-4 h-4" />WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            {biz.description && (
              <div className="card p-6">
                <h2 className="text-h3 font-heading font-bold text-primary mb-3">Sobre nosotros</h2>
                <p className="text-primary/60 leading-relaxed">{biz.description}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
              {[
                { key:'products', label:`Productos (${activeProducts.length})` },
                { key:'reviews',  label:`Reseñas (${biz.reviews?.length || 0})` },
                { key:'gallery',  label:`Galería (${gallery.length})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === key ? 'border-primary text-primary' : 'border-transparent text-primary/40 hover:text-primary/70'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Productos */}
            {tab === 'products' && (
              activeProducts.length === 0
                ? <EmptyState title="Sin productos aún" description="Este emprendimiento no tiene productos publicados todavía." />
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeProducts.map(p => <ProductCard key={p.id} product={p} business={biz} onView={setSelected} />)}
                  </div>
            )}

            {/* Reseñas */}
            {tab === 'reviews' && (
              <div className="space-y-4">
                {(biz.reviews || []).length === 0
                  ? <EmptyState title="Sin reseñas aún" description="Sé el primero en calificar este emprendimiento." />
                  : (biz.reviews || []).map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-bold">{r.reviewer_name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-primary text-sm">{r.reviewer_name}</p>
                            <StarRating rating={r.rating} size="sm" showValue={false} />
                          </div>
                          {r.comment && <p className="text-sm text-primary/60 mt-1 leading-relaxed">{r.comment}</p>}
                          <p className="text-xs text-primary/30 mt-2">{new Date(r.created_at).toLocaleDateString('es-CO', { dateStyle:'long' })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                }
                <ReviewForm businessId={biz.id} onSuccess={() => publicAPI.getBusiness(slug).then(r => setBiz(r.data.data)).catch(() => {})} />
              </div>
            )}

            {/* Galería */}
            {tab === 'gallery' && (
              gallery.length === 0
                ? <EmptyState title="Sin imágenes en galería" description="Este emprendimiento no ha subido fotos de galería aún." />
                : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                        <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Categorías */}
            {biz.categories?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-bold text-primary/50 uppercase tracking-wider mb-3">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {biz.categories.map(c => <span key={c.id} className="badge-primary">{c.name}</span>)}
                </div>
              </div>
            )}

            {/* Contacto */}
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-bold text-primary/50 uppercase tracking-wider">Contacto</h3>
              {biz.whatsapp && (
                <button onClick={() => {
                  analyticsAPI.event({ business_id: biz.id, event_type: 'whatsapp_click', session_id: 'sidebar', duration_seconds: 0 }).catch(() => {})
                  window.open(`https://wa.me/${biz.whatsapp}?text=${encodeURIComponent('Hola, vi tu tienda en Vitrina Empresarial y me gustaría más información.')}`, '_blank')
                }} className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                  <FiMessageCircle className="w-5 h-5 text-green-600" />
                  <div className="text-left"><p className="text-sm font-bold text-green-700">WhatsApp</p><p className="text-xs text-green-600">{biz.whatsapp}</p></div>
                </button>
              )}
              {[
                { icon: FiInstagram, val: biz.instagram, label: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100', href: `https://instagram.com/${biz.instagram?.replace('@','')}` },
                { icon: FiFacebook, val: biz.facebook,  label: 'Facebook',  color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100',  href: `https://facebook.com/${biz.facebook}` },
                { icon: FiGlobe,    val: biz.website,   label: 'Sitio web', color: 'text-primary',  bg: 'bg-gray-50 hover:bg-gray-100',   href: biz.website },
              ].filter(s => s.val).map(({ icon: Icon, val, label, color, bg, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                  <div><p className={`text-sm font-bold ${color}`}>{label}</p><p className="text-xs text-primary/40 truncate">{val}</p></div>
                </a>
              ))}
              {biz.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <FiMapPin className="w-5 h-5 text-primary/50 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary/60">{biz.address}</p>
                </div>
              )}
            </div>

            {/* Horarios */}
            {biz.hours?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-bold text-primary/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FiClock className="w-4 h-4" /> Horarios
                </h3>
                <div className="space-y-1.5">
                  {biz.hours.map(h => (
                    <div key={h.day_of_week} className={`flex items-center justify-between text-sm py-1 ${h.day_of_week === today ? 'font-bold text-primary' : 'text-primary/50'}`}>
                      <span className="flex items-center gap-2">
                        {h.day_of_week === today && <span className="w-1.5 h-1.5 bg-accent rounded-full" />}
                        {DAYS[h.day_of_week]}
                      </span>
                      <span>{h.is_closed ? 'Cerrado' : `${h.open_time?.slice(0,5)} - ${h.close_time?.slice(0,5)}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && <ProductModal product={selected} business={biz} onClose={() => setSelected(null)} />}
      <Footer />
    </div>
  )
}
