import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiArrowRight, FiMapPin, FiMessageCircle, FiStar, FiTrendingUp } from 'react-icons/fi'
import { publicAPI, analyticsAPI } from '../../services/api'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { StarRating, StockBadge, SkeletonCard, EmptyState } from '../../components/common/UI'

const CATEGORY_ICONS = { 'moda':'👗', 'salud-belleza':'💆', 'alimentos':'🍰', 'servicios':'🔧', 'hogar':'🏡', 'restaurantes':'🍽️' }

export default function HomePage() {
  const navigate = useNavigate()
  const [businesses,  setBusinesses]  = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [activecat,   setActiveCat]   = useState('')
  const [page,        setPage]        = useState(1)
  const [meta,        setMeta]        = useState(null)

  useEffect(() => {
    publicAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 8 }
    if (activecat) params.category = activecat
    publicAPI.getBusinesses(params)
      .then(r => { setBusinesses(r.data.data); setMeta(r.data.meta) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activecat, page])

  const handleSearch = e => {
    e.preventDefault()
    if (search.trim().length >= 2) navigate(`/buscar?q=${encodeURIComponent(search.trim())}`)
  }

  const handleWhatsApp = (biz, e) => {
    e.preventDefault()
    e.stopPropagation()
    analyticsAPI.event({ business_id: biz.id, event_type: 'whatsapp_click', session_id: 'home', duration_seconds: 0 }).catch(() => {})
    window.open(`https://wa.me/${biz.whatsapp}?text=${encodeURIComponent('Hola, vi tu tienda en Vitrina Empresarial y me gustaría más información.')}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <section className="gradient-brand pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="page-section relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent text-sm font-bold px-4 py-2 rounded-full mb-6">
              <FiTrendingUp className="w-4 h-4" />
              Descubre emprendimientos locales
            </div>
            <h1 className="text-display font-heading font-black text-white mb-4 text-balance">
              Tu vitrina para <span className="text-accent">emprendedores</span>
            </h1>
            <p className="text-white/70 text-lg font-body mb-10 max-w-lg mx-auto">
              Explora productos y servicios de emprendedores locales. Conecta directamente con ellos vía WhatsApp.
            </p>
            {/* Buscador hero */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar emprendimientos o productos..."
                  className="input pl-12 py-4 text-base shadow-card"
                />
              </div>
              <button type="submit" className="btn-accent px-6 py-4 text-base flex-shrink-0">
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="page-section py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Categorías</h2>
          <Link to="/categorias" className="text-sm font-semibold text-primary/50 hover:text-primary flex items-center gap-1 transition-colors">
            Ver todas <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setActiveCat(''); setPage(1) }}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
              !activecat ? 'bg-primary text-white shadow-card' : 'bg-white text-primary border border-gray-200 hover:border-primary/30'
            }`}
          >
            🏪 Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCat(cat.slug); setPage(1) }}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
                activecat === cat.slug
                  ? 'bg-primary text-white shadow-card'
                  : 'bg-white text-primary border border-gray-200 hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              {CATEGORY_ICONS[cat.slug] || '🏷️'} {cat.name}
              {cat.business_count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activecat === cat.slug ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  {cat.business_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* EMPRENDIMIENTOS */}
      <section className="page-section pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">
            {activecat ? categories.find(c => c.slug === activecat)?.name : 'Todos los emprendimientos'}
          </h2>
          {meta && <p className="text-sm text-primary/40">{meta.total} resultado{meta.total !== 1 ? 's' : ''}</p>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState
            title="No hay emprendimientos en esta categoría"
            description="Pronto habrá nuevos emprendedores registrados aquí. ¡Vuelve más tarde!"
            action={
              <button onClick={() => { setActiveCat(''); setPage(1) }} className="btn-primary">
                Ver todos los emprendimientos
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map((biz, i) => (
                <Link
                  key={biz.id}
                  to={`/tienda/${biz.slug}`}
                  className="card group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => analyticsAPI.event({ business_id: biz.id, event_type: 'page_view', session_id: 'home_card', duration_seconds: 0 }).catch(() => {})}
                >
                  {/* Portada */}
                  <div className="relative h-44 overflow-hidden bg-primary/5">
                    {biz.cover_url ? (
                      <img src={biz.cover_url} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full gradient-brand flex items-center justify-center">
                        <span className="text-5xl font-heading font-black text-accent/30">{biz.name[0]}</span>
                      </div>
                    )}
                    {/* Logo */}
                    <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl border-2 border-white shadow-card bg-white overflow-hidden">
                      {biz.logo_url
                        ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-primary flex items-center justify-center"><span className="text-accent font-black text-lg">{biz.name[0]}</span></div>
                      }
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-primary text-base leading-tight mb-1 group-hover:text-accent transition-colors">{biz.name}</h3>
                    {biz.description && <p className="text-primary/50 text-sm line-clamp-2 mb-3">{biz.description}</p>}

                    <div className="flex items-center justify-between">
                      <StarRating rating={biz.avg_rating || 0} showValue={true} />
                      {biz.address && (
                        <span className="flex items-center gap-1 text-xs text-primary/40">
                          <FiMapPin className="w-3 h-3" />{biz.address.split(',')[0]}
                        </span>
                      )}
                    </div>

                    {/* Categorías */}
                    {biz.categories?.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {biz.categories.slice(0, 2).map(c => (
                          <span key={c.id} className="badge-primary text-xs">{c.name}</span>
                        ))}
                      </div>
                    )}

                    {/* WhatsApp */}
                    {biz.whatsapp && (
                      <button
                        onClick={e => handleWhatsApp(biz, e)}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95"
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Contactar por WhatsApp
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Paginación simple */}
            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary disabled:opacity-30 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  ← Anterior
                </button>
                <span className="text-sm text-primary/50">Página {page} de {meta.pages}</span>
                <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary disabled:opacity-30 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}
