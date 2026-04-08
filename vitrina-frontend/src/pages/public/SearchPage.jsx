import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiSearch, FiShoppingBag, FiX } from 'react-icons/fi'
import { searchAPI, analyticsAPI } from '../../services/api'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { StarRating, Spinner, EmptyState } from '../../components/common/UI'

export default function SearchPage() {
  const [params, setParams]     = useSearchParams()
  const [query,  setQuery]      = useState(params.get('q') || '')
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [tab,     setTab]       = useState('all')
  const debounceRef             = useRef(null)

  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await searchAPI.search(q.trim())
      setResults(res.data.data)
      analyticsAPI.event({ event_type: 'search', session_id: 'search_page', search_query: q.trim(), duration_seconds: 0 }).catch(() => {})
    } catch { setResults(null) } finally { setLoading(false) }
  }

  useEffect(() => {
    const q = params.get('q')
    if (q) { setQuery(q); doSearch(q) }
  }, [])

  const handleChange = (val) => {
    setQuery(val)
    setParams(val ? { q: val } : {})
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const businesses = results?.businesses || []
  const products   = results?.products   || []
  const totalBiz   = businesses.length
  const totalProd  = products.length
  const showBiz    = tab === 'all' || tab === 'businesses'
  const showProd   = tab === 'all' || tab === 'products'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 page-section py-10">

        {/* Buscador */}
        <div className="max-w-2xl mx-auto mb-10">
          <h1 className="text-h1 font-heading font-black text-primary text-center mb-6">Buscar</h1>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
            <input
              type="text" value={query} onChange={e => handleChange(e.target.value)}
              placeholder="Busca emprendimientos o productos..."
              className="input pl-12 pr-10 py-4 text-base shadow-card"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null); setParams({}) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
          {query.length === 1 && <p className="text-xs text-primary/40 text-center mt-2">Escribe al menos 2 caracteres</p>}
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {results && !loading && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {[
                { key:'all',        label:`Todo (${totalBiz + totalProd})` },
                { key:'businesses', label:`Emprendimientos (${totalBiz})` },
                { key:'products',   label:`Productos (${totalProd})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === key ? 'border-primary text-primary' : 'border-transparent text-primary/40 hover:text-primary/70'}`}>
                  {label}
                </button>
              ))}
            </div>

            {totalBiz === 0 && totalProd === 0 && (
              <EmptyState icon={FiSearch} title="Sin resultados"
                description={`No encontramos resultados para "${query}". Intenta con otras palabras.`} />
            )}

            {/* Emprendimientos */}
            {showBiz && businesses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-h3 font-heading font-bold text-primary mb-4 flex items-center gap-2">
                  <FiShoppingBag className="w-5 h-5 text-accent" /> Emprendimientos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.map(b => (
                    <Link key={b.id} to={`/tienda/${b.slug}`} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all group">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary flex-shrink-0">
                        {b.logo_url
                          ? <img src={b.logo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><span className="text-accent font-black text-xl">{b.name[0]}</span></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-primary group-hover:text-accent transition-colors truncate">{b.name}</p>
                        {b.description && <p className="text-xs text-primary/50 line-clamp-1 mt-0.5">{b.description}</p>}
                        {b.avg_rating > 0 && <StarRating rating={b.avg_rating} size="sm" />}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Productos */}
            {showProd && products.length > 0 && (
              <div>
                <h2 className="text-h3 font-heading font-bold text-primary mb-4 flex items-center gap-2">
                  <FiShoppingBag className="w-5 h-5 text-accent" /> Productos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(p => (
                    <Link key={p.id} to={`/tienda/${p.business_slug}`} className="card group hover:shadow-card-hover transition-all overflow-hidden">
                      <div className="h-36 overflow-hidden bg-gray-100">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          : <div className="w-full h-full gradient-brand flex items-center justify-center"><span className="text-accent/30 font-black text-3xl">{p.name[0]}</span></div>}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-primary text-sm group-hover:text-accent transition-colors truncate">{p.name}</p>
                        <p className="text-xs text-primary/40 mt-0.5">{p.business_name}</p>
                        <p className="font-bold text-primary mt-2">${Number(p.base_price).toLocaleString('es-CO')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!results && !loading && !query && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-10 h-10 text-primary/20" />
            </div>
            <p className="text-primary/40 font-body">Escribe para buscar emprendimientos y productos</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
