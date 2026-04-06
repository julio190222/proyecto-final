import { useState, useEffect, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { categoriesAPI } from '../../services/api'
import { Spinner, EmptyState, Modal } from '../../components/common/UI'
import toast from 'react-hot-toast'

function CategoryForm({ category, parents, onSuccess, onClose }) {
  const [form, setForm] = useState({ name: category?.name || '', parent_id: category?.parent_id || '', description: category?.description || '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      const data = { name: form.name, description: form.description, parent_id: form.parent_id || null }
      if (category) await categoriesAPI.update(category.id, data)
      else await categoriesAPI.create(data)
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ej: Moda, Alimentos..." />
      </div>
      <div>
        <label className="label">Categoría padre (opcional)</label>
        <select className="input" value={form.parent_id} onChange={e => setForm(p=>({...p,parent_id:e.target.value}))}>
          <option value="">— Es categoría principal —</option>
          {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input resize-none h-20" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Descripción opcional..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : category ? 'Actualizar' : 'Crear categoría'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [expanded,   setExpanded]   = useState({})

  const load = useCallback(() => {
    setLoading(true)
    categoriesAPI.list()
      .then(r => setCategories(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await categoriesAPI.remove(cat.id)
      toast.success('Categoría eliminada')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se puede eliminar esta categoría')
    }
  }

  const toggleActive = async (cat) => {
    try {
      await categoriesAPI.update(cat.id, { is_active: !cat.is_active })
      toast.success(cat.is_active ? 'Categoría desactivada' : 'Categoría activada')
      load()
    } catch { toast.error('Error al actualizar') }
  }

  const parents    = categories.filter(c => !c.parent_id)
  const mainCats   = categories.filter(c => !c.parent_id)
  const subCats    = categories.filter(c => c.parent_id)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-heading font-black text-primary">Categorías</h1>
          <p className="text-primary/50 font-body mt-1">{mainCats.length} principales · {subCats.length} subcategorías</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true) }} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" /> Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : mainCats.length === 0 ? (
        <EmptyState icon={FiTag} title="Sin categorías" description="Crea la primera categoría." />
      ) : (
        <div className="space-y-3">
          {mainCats.map(cat => {
            const subs = subCats.filter(s => s.parent_id === cat.id)
            const isOpen = expanded[cat.id]
            return (
              <div key={cat.id} className="card overflow-hidden">
                {/* Categoría principal */}
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => setExpanded(p => ({...p, [cat.id]: !p[cat.id]}))}
                    className="p-1 rounded-lg hover:bg-gray-100 text-primary/40 transition-colors flex-shrink-0">
                    {isOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <FiTag className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-primary">{cat.name}</p>
                      <span className={`badge text-xs ${cat.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {cat.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      {subs.length > 0 && <span className="badge-primary text-xs">{subs.length} subcategorías</span>}
                      {cat.business_count > 0 && <span className="badge badge-accent text-xs">{cat.business_count} negocios</span>}
                    </div>
                    {cat.description && <p className="text-xs text-primary/40 mt-0.5 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setEditing(cat); setModal(true) }} className="p-2 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(cat)} className="p-2 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors text-xs font-semibold px-3">
                      {cat.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Subcategorías */}
                {isOpen && subs.length > 0 && (
                  <div className="border-t border-gray-50 bg-gray-50/50">
                    {subs.map((sub, i) => (
                      <div key={sub.id} className={`flex items-center gap-3 px-4 py-3 ${i < subs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="w-6 ml-8 flex-shrink-0" />
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FiTag className="w-3 h-3 text-primary/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-primary">{sub.name}</p>
                            <span className={`badge text-xs ${sub.is_active ? 'badge-success' : 'badge-danger'}`}>{sub.is_active ? 'Activa' : 'Inactiva'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditing(sub); setModal(true) }} className="p-1.5 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"><FiEdit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(sub)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><FiTrash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isOpen && subs.length === 0 && (
                  <div className="border-t border-gray-50 px-16 py-3 text-xs text-primary/30">Sin subcategorías</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <CategoryForm category={editing} parents={parents} onSuccess={() => { setModal(false); setEditing(null); load() }} onClose={() => { setModal(false); setEditing(null) }} />
      </Modal>
    </div>
  )
}
