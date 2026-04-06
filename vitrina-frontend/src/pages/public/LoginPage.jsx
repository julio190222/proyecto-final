import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const from = location.state?.from?.pathname || null

  const handleChange = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Completa todos los campos'); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.must_change_password) { toast('Debes cambiar tu contraseña', { icon: '🔐' }); navigate('/change-password', { replace: true }); return }
      toast.success(`Bienvenido, ${user.name.split(' ')[0]}`)
      if (from) { navigate(from, { replace: true }); return }
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'entrepreneur') navigate('/mi-tienda', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-accent">
            <span className="text-primary font-black text-2xl font-heading">V</span>
          </div>
          <div>
            <p className="text-white font-heading font-bold text-lg leading-tight">Vitrina Empresarial</p>
            <p className="text-white/50 text-sm">Digital</p>
          </div>
        </Link>
        <div className="relative z-10">
          <div className="inline-block bg-accent/20 text-accent text-xs font-bold px-3 py-1.5 rounded-full mb-6">Panel de gestión</div>
          <h1 className="text-4xl font-heading font-black text-white leading-tight mb-4">Impulsa tu<br /><span className="text-accent">emprendimiento</span></h1>
          <p className="text-white/60 leading-relaxed max-w-sm">Gestiona tu microtienda, actualiza productos y conecta con tus clientes desde un solo lugar.</p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {[{ num:'8+',label:'Emprendimientos'},{ num:'60+',label:'Funcionalidades'},{ num:'6',label:'Categorías'},{ num:'100%',label:'Gratuito'}].map(({ num, label }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-accent font-heading font-black text-2xl">{num}</p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs relative z-10">© {new Date().getFullYear()} Vitrina Empresarial Digital</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link to="/"><div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><span className="text-accent font-black text-lg">V</span></div></Link>
            <p className="font-heading font-bold text-primary text-sm">Vitrina Empresarial Digital</p>
          </div>
          <div className="mb-8">
            <h2 className="text-h1 font-heading font-black text-primary">Bienvenido</h2>
            <p className="text-primary/50 mt-1">Ingresa tus credenciales para continuar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" autoComplete="email" className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                  {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ingresando...</>) : 'Ingresar'}
            </button>
          </form>

          {/* Credenciales de demo */}
          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-xs font-bold text-primary/50 uppercase tracking-wider mb-3">Credenciales de demo</p>
            <div className="space-y-2">
              {[
                { role: 'Administrador', email: 'admin@vitrina.co', pwd: 'Admin2024*' },
                { role: 'Emprendedor',   email: 'valentina@deliciastorres.co', pwd: 'Temp2024*' },
              ].map(({ role, email, pwd }) => (
                <button key={role} type="button" onClick={() => { setForm({ email, password: pwd }); setError('') }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                  <span className="text-xs font-bold text-primary/40 group-hover:text-primary/60 block">{role}</span>
                  <span className="text-sm font-semibold text-primary">{email}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-primary/40 hover:text-primary transition-colors">← Volver al portal público</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
