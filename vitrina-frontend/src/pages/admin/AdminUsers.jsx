import { useState, useEffect, useCallback } from 'react'
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiSearch, FiUser, FiRefreshCw, FiEye, FiEyeOff, FiX } from 'react-icons/fi'
import { usersAPI, categoriesAPI, authAPI } from '../../services/api'
import { Spinner, EmptyState, Pagination, Modal } from '../../components/common/UI'
import toast from 'react-hot-toast'

function UserForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ name:'', email:'', business_name:'', description:'', address:'', whatsapp:'', instagram:'', category_ids:[] })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    categoriesAPI.list().then(r => setCategories(r.data.data.filter(c => !c.parent_id))).catch(() => {})
  }, [])

  const toggle = id => setForm(p => ({
    ...p,
    category_ids: p.category_ids.includes(id) ? p.category_ids.filter(c => c !== id) : [...p.category_ids, id]
  }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.business_name) { toast.error('Nombre, email y nombre de tienda son requeridos'); return }
    setLoading(true)
    try {
      const res = await usersAPI.create(form)
      const { temp_password, email } = res.data.data
      toast.success(`Emprendedor creado. Contraseña temporal: ${temp_password}`, { duration: 8000 })
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear el emprendedor')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Nombre completo *</label><input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ej: María López" /></div>
        <div><label className="label">Correo electrónico *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="correo@ejemplo.com" /></div>
        <div><label className="label">Nombre de la tienda *</label><input className="input" value={form.business_name} onChange={e => setForm(p=>({...p,business_name:e.target.value}))} placeholder="Ej: Artesanías López" /></div>
        <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp} onChange={e => setForm(p=>({...p,whatsapp:e.target.value}))} placeholder="3001234567" /></div>
        <div><label className="label">Dirección</label><input className="input" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="Calle 45 #23-10, Ciudad" /></div>
        <div><label className="label">Instagram</label><input className="input" value={form.instagram} onChange={e => setForm(p=>({...p,instagram:e.target.value}))} placeholder="@tienda" /></div>
      </div>
      <div><label className="label">Descripción del negocio</label><textarea className="input resize-none h-20" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Describe brevemente el negocio..." /></div>
      <div>
        <label className="label">Categorías</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c.id} type="button" onClick={() => toggle(c.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${form.category_ids.includes(c.id) ? 'bg-primary text-white' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</> : 'Crear emprendedor'}
        </button>
      </div>
    </form>
  )
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [meta,    setMeta]    = useState(null)
  const [modal,   setModal]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    usersAPI.list({ page, limit: 10, search: search || undefined })
      .then(r => { setUsers(r.data.data); setMeta(r.data.meta) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = e => { e.preventDefault(); setPage(1); load() }

  const toggleStatus = async (user) => {
    try {
      await usersAPI.toggleStatus(user.id, !user.is_active)
      toast.success(user.is_active ? 'Cuenta desactivada' : 'Cuenta activada')
      load()
    } catch { toast.error('Error al cambiar estado') }
  }

  const resetPwd = async (user) => {
    try {
      const res = await authAPI.resetPassword(user.id)
      const { temp_password } = res.data.data
      toast.success(`Nueva contraseña temporal: ${temp_password}`, { duration: 10000 })
    } catch { toast.error('Error al restablecer contraseña') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-heading font-black text-primary">Usuarios</h1>
          <p className="text-primary/50 font-body mt-1">Gestión de emprendedores</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <FiPlus className="w-5 h-5" /> Nuevo emprendedor
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o tienda..." className="input pl-10" />
        </div>
        <button type="submit" className="btn-primary px-5">Buscar</button>
        {search && <button type="button" onClick={() => { setSearch(''); setPage(1) }} className="btn-outline px-4"><FiX className="w-4 h-4" /></button>}
      </form>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={FiUser} title="No hay emprendedores" description="Crea el primer emprendedor con el botón de arriba." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Emprendedor</th>
                  <th>Tienda</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-bold text-sm">{u.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-sm">{u.name}</p>
                          <p className="text-xs text-primary/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-primary">{u.business_name || '—'}</p>
                      {u.must_change_password && <span className="badge-warning text-xs">Debe cambiar contraseña</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-xs text-primary/40">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('es-CO') : 'Nunca'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleStatus(u)} title={u.is_active ? 'Desactivar' : 'Activar'}
                          className={`p-2 rounded-lg transition-colors ${u.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
                          {u.is_active ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => resetPwd(u)} title="Restablecer contraseña"
                          className="p-2 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors">
                          <FiRefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && <Pagination page={page} pages={meta.pages} onPageChange={setPage} />}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo emprendedor" size="lg">
        <UserForm onSuccess={() => { setModal(false); load() }} onClose={() => setModal(false)} />
      </Modal>
    </div>
  )
}
