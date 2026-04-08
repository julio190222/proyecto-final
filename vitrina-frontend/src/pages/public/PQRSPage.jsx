import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSend, FiCheckCircle } from 'react-icons/fi'
import { pqrsAPI } from '../../services/api'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import toast from 'react-hot-toast'

const TYPES = [
  { value:'petition',  label:'Petición',    desc:'Solicitud de información o acción' },
  { value:'complaint', label:'Queja',       desc:'Inconformidad con un producto o servicio' },
  { value:'claim',     label:'Reclamo',     desc:'Exigencia de un derecho o compensación' },
  { value:'suggestion',label:'Sugerencia',  desc:'Propuesta de mejora para la plataforma' },
]

export default function PQRSPage() {
  const [form,    setForm]    = useState({ name:'', email:'', type:'suggestion', message:'' })
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { toast.error('Completa todos los campos'); return }
    setLoading(true)
    try {
      await pqrsAPI.create(form)
      setSent(true)
    } catch { toast.error('Error al enviar. Intenta nuevamente.') } finally { setLoading(false) }
  }

  if (sent) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 flex items-center justify-center px-4 pb-16">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-h2 font-heading font-black text-primary mb-3">¡Enviado con éxito!</h2>
          <p className="text-primary/60 mb-8">Tu solicitud fue registrada. El equipo administrativo la revisará y dará respuesta a la brevedad posible.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">← Volver al inicio</Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 page-section">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-h1 font-heading font-black text-primary">PQRS</h1>
            <p className="text-primary/50 mt-2">Peticiones, quejas, reclamos y sugerencias</p>
          </div>
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Tu nombre completo" /></div>
                <div><label className="label">Correo *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="correo@ejemplo.com" /></div>
              </div>
              <div>
                <label className="label">Tipo de solicitud *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(p=>({...p,type:t.value}))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.type === t.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'}`}>
                      <p className="font-semibold text-primary text-sm">{t.label}</p>
                      <p className="text-xs text-primary/40 mt-0.5 leading-tight">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">Mensaje *</label>
                <textarea className="input resize-none h-32" value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} placeholder="Describe tu solicitud con detalle..." /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</> : <><FiSend className="w-4 h-4" />Enviar solicitud</>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
