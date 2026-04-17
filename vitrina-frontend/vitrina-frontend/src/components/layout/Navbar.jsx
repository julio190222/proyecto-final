// ============================================================
//  components/layout/Navbar.jsx
//  Barra de navegación del portal público
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiMenu, FiX, FiLogIn, FiGrid } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'


export default function Navbar() {
  const { isAuthenticated, isAdmin, isEntrepreneur, user } = useAuth()
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
  }

  const dashboardLink = isAdmin ? '/admin' : '/mi-tienda'
  const dashboardLabel = isAdmin ? 'Panel Admin' : 'Mi Tienda'

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-card' : 'bg-primary'
    }`}>
      <div className="page-section">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src={logo} 
              alt="Soledad Conecta" 
              className={`h-16 w-auto object-contain transition-all duration-300 hover:scale-105
                ${scrolled 
                  ? ''                    
                  : 'brightness-0 invert' 
                }
              `}
              style={{ maxWidth: '160px' }}
            />
          </Link>

          {/* Barra de búsqueda — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${scrolled ? 'text-primary/40' : 'text-white/50'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar emprendimientos o productos..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-body transition-all
                  focus:outline-none focus:ring-2 focus:ring-accent/50
                  ${scrolled
                    ? 'bg-gray-100 text-primary placeholder-primary/40 border border-transparent focus:border-primary/20'
                    : 'bg-white/10 text-white placeholder-white/50 border border-white/20 focus:bg-white/20'
                  }`}
              />
            </div>
          </form>

          {/* Acciones desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/categorias"
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-all
                ${scrolled ? 'text-primary hover:bg-primary/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <FiGrid className="w-4 h-4" />
              Categorías
            </Link>

            {isAuthenticated ? (
              <Link to={dashboardLink} className="btn-accent text-sm py-2 px-4">
                {dashboardLabel}
              </Link>
            ) : (
              <Link to="/login" className="btn-accent text-sm py-2 px-4 flex items-center gap-2">
                <FiLogIn className="w-4 h-4" />
                Ingresar
              </Link>
            )}
          </div>

          {/* Menú hamburguesa mobile */}
          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-primary' : 'text-white'}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-card animate-slide-down">
          <div className="p-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="input pl-9"
                />
              </div>
            </form>
            <Link to="/categorias" className="flex items-center gap-2 py-2 text-primary font-semibold" onClick={() => setMenuOpen(false)}>
              <FiGrid className="w-4 h-4" /> Categorías
            </Link>
            {isAuthenticated
              ? <Link to={dashboardLink} className="btn-primary w-full text-center block" onClick={() => setMenuOpen(false)}>{dashboardLabel}</Link>
              : <Link to="/login" className="btn-accent w-full text-center block" onClick={() => setMenuOpen(false)}>Ingresar</Link>
            }
          </div>
        </div>
      )}
    </header>
  )
}
