import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isFirst = user?.must_change_password

  const rules = [
    { label: 'Mínimo 8 caracteres',    ok: form.new_password.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(form.new_password) },
    { label: 'Al menos un número',     ok: /[0-9]/.test(form.new_password) },
    { label: 'Las contraseñas coinciden', ok: form.new_password && form.new_password === form.confirm },
  ]
  const allValid = rules.every(r => r.ok)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!allValid) { setError('Revisa los requisitos de la contraseña'); return }
    setLoading(true)
    try {
      await authAPI.changePassword({ current_password: form.current_password, new_password: form.new_password })
      updateUser({ must_change_password: false })
      toast.success('Contraseña actualizada correctamente')
      if (user?.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/mi-tienda', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-h2 font-heading font-black text-primary">
              {isFirst ? 'Crea tu contraseña' : 'Cambiar contraseña'}
            </h1>
            <p className="text-primary/50 text-sm mt-2">
              {isFirst ? 'Por seguridad debes crear una contraseña propia antes de continuar.' : 'Ingresa tu contraseña actual y la nueva.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'current_password', label: isFirst ? 'Contraseña temporal' : 'Contraseña actual', show: 'current' },
              { key: 'new_password',     label: 'Nueva contraseña',    show: 'new' },
              { key: 'confirm',          label: 'Confirmar contraseña', show: 'confirm' },
            ].map(({ key, label, show: showKey }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    value={form[key]}
                    onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setError('') }}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                    {show[showKey] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {/* Reglas */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {rules.map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-2 text-sm transition-colors ${ok ? 'text-green-600' : 'text-primary/40'}`}>
                  <FiCheckCircle className={`w-4 h-4 flex-shrink-0 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
                  {label}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading || !allValid} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
