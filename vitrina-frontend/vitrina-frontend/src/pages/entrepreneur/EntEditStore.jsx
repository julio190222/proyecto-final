import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiSave, FiArrowLeft, FiUpload, FiX, FiImage,
  FiPhone, FiMapPin, FiGlobe, FiInstagram,
  FiFacebook, FiTwitter, FiInfo, FiShoppingBag
} from 'react-icons/fi'
import { businessAPI, categoriesAPI } from '../../services/api'
import { Spinner } from '../../components/common/UI'
import toast from 'react-hot-toast'

// ── Campo de texto reutilizable ───────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-primary font-heading">
        {Icon && <Icon className="w-4 h-4 text-primary/40" />}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  )
}

// ── Subida de imagen con preview ──────────────────────────────
function ImageUploader({ label, fieldName, currentUrl, onUpload, aspect = 'square', hint }) {
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const inputRef                = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const form = new FormData()
      form.append(fieldName, file)
      await onUpload(form)
      toast.success(`${label} actualizada`)
    } catch {
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const src = preview || currentUrl

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-primary font-heading">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-2xl overflow-hidden transition-all group
          ${aspect === 'square'  ? 'w-32 h-32' : ''}
          ${aspect === 'banner'  ? 'w-full h-36' : ''}
          bg-primary/5 flex items-center justify-center`}
      >
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <FiImage className="w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
        }
        <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {loading
            ? <Spinner size="sm" />
            : <FiUpload className="w-6 h-6 text-white" />
          }
        </div>
      </div>
      {hint && <p className="text-xs text-primary/40 font-body">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function EntEditStore() {
  const navigate = useNavigate()

  const [biz,      setBiz]      = useState(null)
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  const [form, setForm] = useState({
    name: '', description: '', whatsapp: '', address: '',
    website: '', instagram: '', facebook: '', twitter: '',
    category_id: '',
  })

  useEffect(() => {
    Promise.all([businessAPI.getMyBusiness(), categoriesAPI.list()])
      .then(([bRes, cRes]) => {
        const b = bRes.data.data
        setBiz(b)
        setCats(cRes.data.data || [])
        setForm({
          name:        b.name        || '',
          description: b.description || '',
          whatsapp:    b.whatsapp    || '',
          address:     b.address     || '',
          website:     b.website     || '',
          instagram:   b.instagram   || '',
          facebook:    b.facebook    || '',
          twitter:     b.twitter     || '',
          category_id: b.category_id || '',
        })
      })
      .catch(() => toast.error('No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name        = 'El nombre es requerido'
    if (!form.description.trim()) e.description = 'La descripción es requerida'
    if (!form.whatsapp.trim())    e.whatsapp    = 'El WhatsApp es requerido'
    if (form.whatsapp && !/^\+?[\d\s\-()]{7,}$/.test(form.whatsapp))
      e.whatsapp = 'Número inválido'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      await businessAPI.updateMyBiz(form)
      toast.success('Tienda actualizada correctamente')
      navigate('/mi-tienda')
    } catch {
      // el interceptor ya muestra el toast
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">

      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/mi-tienda')}
          className="w-10 h-10 rounded-xl border border-primary/10 flex items-center justify-center hover:bg-primary/5 transition-colors">
          <FiArrowLeft className="w-4 h-4 text-primary" />
        </button>
        <div>
          <h1 className="text-h2 font-heading font-black text-primary">Editar tienda</h1>
          <p className="text-sm text-primary/40 font-body">Actualiza la información de tu negocio</p>
        </div>
      </div>

      {/* Imágenes */}
      <div className="card p-6 space-y-4">
        <h2 className="text-h3 font-heading font-bold text-primary flex items-center gap-2">
          <FiImage className="w-4 h-4" /> Imágenes
        </h2>
        <div className="flex flex-wrap gap-6">
          <ImageUploader
            label="Logo"
            fieldName="logo"
            currentUrl={biz?.logo_url}
            onUpload={businessAPI.uploadLogo}
            aspect="square"
            hint="Cuadrado, min. 200×200px"
          />
          <div className="flex-1 min-w-[200px]">
            <ImageUploader
              label="Portada / Banner"
              fieldName="cover"
              currentUrl={biz?.cover_url}
              onUpload={businessAPI.uploadCover}
              aspect="banner"
              hint="Recomendado 1200×400px"
            />
          </div>
        </div>
      </div>

      {/* Información básica */}
      <div className="card p-6 space-y-5">
        <h2 className="text-h3 font-heading font-bold text-primary flex items-center gap-2">
          <FiInfo className="w-4 h-4" /> Información básica
        </h2>

        <Field label="Nombre del negocio *" icon={FiShoppingBag} error={errors.name}>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej. Reparaciones Vargas"
            className={`input w-full ${errors.name ? 'border-red-400 focus:ring-red-200' : ''}`}
          />
        </Field>

        <Field label="Descripción *" icon={FiInfo} error={errors.description}>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Describe brevemente qué ofrece tu negocio..."
            className={`input w-full resize-none ${errors.description ? 'border-red-400 focus:ring-red-200' : ''}`}
          />
          <p className="text-xs text-primary/30 text-right">{form.description.length}/300</p>
        </Field>

        <Field label="Categoría" icon={FiShoppingBag}>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            className="input w-full"
          >
            <option value="">Sin categoría</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Contacto y ubicación */}
      <div className="card p-6 space-y-5">
        <h2 className="text-h3 font-heading font-bold text-primary flex items-center gap-2">
          <FiPhone className="w-4 h-4" /> Contacto y ubicación
        </h2>

        <Field label="WhatsApp *" icon={FiPhone} error={errors.whatsapp}>
          <input
            value={form.whatsapp}
            onChange={e => set('whatsapp', e.target.value)}
            placeholder="+57 300 000 0000"
            className={`input w-full ${errors.whatsapp ? 'border-red-400 focus:ring-red-200' : ''}`}
          />
        </Field>

        <Field label="Dirección" icon={FiMapPin}>
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Cra. 50 #30-10, Barranquilla"
            className="input w-full"
          />
        </Field>

        <Field label="Sitio web" icon={FiGlobe}>
          <input
            value={form.website}
            onChange={e => set('website', e.target.value)}
            placeholder="https://misitioweb.com"
            className="input w-full"
          />
        </Field>
      </div>

      {/* Redes sociales */}
      <div className="card p-6 space-y-5">
        <h2 className="text-h3 font-heading font-bold text-primary flex items-center gap-2">
          <FiInstagram className="w-4 h-4" /> Redes sociales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Instagram" icon={FiInstagram}>
            <input value={form.instagram} onChange={e => set('instagram', e.target.value)}
              placeholder="@usuario" className="input w-full" />
          </Field>
          <Field label="Facebook" icon={FiFacebook}>
            <input value={form.facebook} onChange={e => set('facebook', e.target.value)}
              placeholder="facebook.com/..." className="input w-full" />
          </Field>
          <Field label="Twitter / X" icon={FiTwitter}>
            <input value={form.twitter} onChange={e => set('twitter', e.target.value)}
              placeholder="@usuario" className="input w-full" />
          </Field>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => navigate('/mi-tienda')}
          className="btn-outline flex items-center gap-2">
          <FiX className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
          {saving ? <Spinner size="sm" /> : <><FiSave className="w-4 h-4" /> Guardar cambios</>}
        </button>
      </div>

    </div>
  )
}