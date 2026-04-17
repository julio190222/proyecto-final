import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiTag } from 'react-icons/fi'
import { publicAPI } from '../../services/api'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Spinner } from '../../components/common/UI'

const ICONS = { 'moda':'👗','salud-belleza':'💆','alimentos':'🍰','servicios':'🔧','hogar':'🏡','restaurantes':'🍽️' }
const COLORS = [
  'from-primary to-primary/80',
  'from-accent/80 to-accent',
  'from-green-600 to-green-500',
  'from-blue-600 to-blue-500',
  'from-pink-600 to-pink-500',
  'from-orange-600 to-orange-500',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    publicAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 page-section">
        <div className="mb-10 text-center">
          <h1 className="text-h1 font-heading font-black text-primary">Categorías</h1>
          <p className="text-primary/50 mt-2 font-body">Explora los emprendimientos por sector</p>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <div key={cat.id} className="card overflow-hidden group">
                {/* Header */}
                <div className={`bg-gradient-to-br ${COLORS[i % COLORS.length]} p-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="text-4xl mb-2 block">{ICONS[cat.slug] || '🏷️'}</span>
                      <h2 className="text-xl font-heading font-black text-white">{cat.name}</h2>
                      <p className="text-white/70 text-sm mt-1">{cat.business_count || 0} emprendimiento{cat.business_count !== 1 ? 's' : ''}</p>
                    </div>
                    <Link to={`/?category=${cat.slug}`}
                      className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors">
                      Ver todos <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Subcategorías */}
                {cat.subcategories?.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-primary/40 uppercase tracking-wider mb-3">Subcategorías</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories.map(sub => (
                        <Link key={sub.id} to={`/?subcategory=${sub.slug}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold rounded-xl transition-colors">
                          <FiTag className="w-3 h-3" />{sub.name}
                        </Link>
                      ))}
                    </div>
                    {cat.description && <p className="text-xs text-primary/40 mt-3 leading-relaxed">{cat.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
