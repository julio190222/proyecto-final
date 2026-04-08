import { useState, useEffect, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPackage, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { productsAPI, categoriesAPI } from '../../services/api'
import { Spinner, EmptyState, Pagination, Modal, StockBadge } from '../../components/common/UI'
import toast from 'react-hot-toast'

function ProductForm({ product, categories, onSuccess, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    base_price: product?.base_price || '', subcategory_id: product?.subcategory_id || '',
  })
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const subcats = categories.filter(c => c.parent_id)

  const addVariant = () => setVariants(p => [...p, { attribute_name:'', attribute_value:'', price_modifier:0, stock:0, sku:'' }])
  const removeVariant = i => setVariants(p => p.filter((_,idx) => idx !== i))
  const updateVariant = (i, key, val) => setVariants(p => p.map((v,idx) => idx === i ? {...v,[key]:val} : v))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.base_price) { toast.error('Nombre y precio son requeridos'); return }
    setLoading(true)
    try {
      const data = { ...form, base_price: parseFloat(form.base_price), subcategory_id: form.subcategory_id || null }
      if (product) {
        await productsAPI.update(product.id, data)
      } else {
        data.variants = variants.filter(v => v.attribute_name && v.attribute_value)
        await productsAPI.create(data)
      }
      toast.success(product ? 'Producto actualizado' : 'Producto creado')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Nombre del producto *</label>
          <input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ej: Torta de chocolate" /></div>
        <div><label className="label">Precio base (COP) *</label>
          <input className="input" type="number" value={form.base_price} onChange={e => setForm(p=>({...p,base_price:e.target.value}))} placeholder="45000" /></div>
        <div><label className="label">Subcategoría</label>
          <select className="input" value={form.subcategory_id} onChange={e => setForm(p=>({...p,subcategory_id:e.target.value}))}>
            <option value="">Sin subcategoría</option>
            {subcats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Descripción</label>
          <textarea className="input resize-none h-20" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Describe el producto..." /></div>
      </div>

      {/* Variantes — solo al crear */}
      {!product && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Variantes (talla, color, tamaño...)</label>
            <button type="button" onClick={addVariant} className="text-sm text-primary font-semibold hover:text-accent transition-colors flex items-center gap-1">
              <FiPlus className="w-4 h-4" /> Agregar variante
            </button>
          </div>
          {variants.length === 0 && <p className="text-xs text-primary/30 py-2">Sin variantes — el producto tendrá precio único</p>}
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-3">
                <input className="input col-span-3 text-sm py-2" placeholder="Atributo (Talla)" value={v.attribute_name} onChange={e => updateVariant(i,'attribute_name',e.target.value)} />
                <input className="input col-span-3 text-sm py-2" placeholder="Valor (M)" value={v.attribute_value} onChange={e => updateVariant(i,'attribute_value',e.target.value)} />
                <input className="input col-span-2 text-sm py-2" type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(i,'stock',e.target.value)} />
                <input className="input col-span-2 text-sm py-2" type="number" placeholder="±Precio" value={v.price_modifier} onChange={e => updateVariant(i,'price_modifier',e.target.value)} />
                <input className="input col-span-1 text-sm py-2" placeholder="SKU" value={v.sku} onChange={e => updateVariant(i,'sku',e.target.value)} />
                <button type="button" onClick={() => removeVariant(i)} className="col-span-1 p-2 text-red-400 hover:text-red-600 flex items-center justify-center"><FiX className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{product ? 'Actualizando...' : 'Creando...'}</> : product ? 'Actualizar' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

function VariantManager({ productId, onClose }) {
  const [variants, setVariants] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [newVar,   setNewVar]   = useState({ attribute_name:'', attribute_value:'', stock:0, price_modifier:0, sku:'' })
  const [saving,   setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    productsAPI.getVariants(productId).then(r => setVariants(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [productId])

  const handleAdd = async e => {
    e.preventDefault()
    if (!newVar.attribute_name || !newVar.attribute_value) { toast.error('Atributo y valor son requeridos'); return }
    setSaving(true)
    try {
      await productsAPI.addVariant(productId, newVar)
      toast.success('Variante agregada')
      setNewVar({ attribute_name:'', attribute_value:'', stock:0, price_modifier:0, sku:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const updateStock = async (variant, stock) => {
    try {
      await productsAPI.updateVariant(productId, variant.id, { stock: parseInt(stock) })
      toast.success('Stock actualizado')
      load()
    } catch { toast.error('Error al actualizar stock') }
  }

  const removeVariant = async (vid) => {
    if (!confirm('¿Eliminar esta variante?')) return
    try { await productsAPI.removeVariant(productId, vid); toast.success('Variante eliminada'); load() }
    catch { toast.error('Error al eliminar') }
  }

  return (
    <div className="space-y-4">
      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <>
          {variants.length === 0 ? (
            <p className="text-center text-primary/30 py-4 text-sm">Sin variantes — agrega una abajo</p>
          ) : (
            <div className="space-y-2">
              {variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{v.attribute_name}: {v.attribute_value}</p>
                    {v.sku && <p className="text-xs text-primary/40">SKU: {v.sku}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-primary/50">Stock:</label>
                    <input type="number" defaultValue={v.stock} onBlur={e => updateStock(v, e.target.value)}
                      className="input w-20 py-1.5 text-sm text-center" min="0" />
                  </div>
                  <StockBadge status={v.stock === 0 ? 'out_of_stock' : v.stock <= 5 ? 'low_stock' : 'available'} />
                  <button onClick={() => removeVariant(v.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><FiX className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          {/* Agregar nueva variante */}
          <form onSubmit={handleAdd} className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary/50 uppercase tracking-wider mb-3">Agregar variante</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input className="input text-sm" placeholder="Atributo (Talla)" value={newVar.attribute_name} onChange={e => setNewVar(p=>({...p,attribute_name:e.target.value}))} />
              <input className="input text-sm" placeholder="Valor (M, Rojo...)" value={newVar.attribute_value} onChange={e => setNewVar(p=>({...p,attribute_value:e.target.value}))} />
              <input className="input text-sm" type="number" placeholder="Stock" value={newVar.stock} onChange={e => setNewVar(p=>({...p,stock:e.target.value}))} />
              <input className="input text-sm" type="number" placeholder="±Precio" value={newVar.price_modifier} onChange={e => setNewVar(p=>({...p,price_modifier:e.target.value}))} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiPlus className="w-4 h-4" />}
              Agregar variante
            </button>
          </form>
        </>
      )}
      <button onClick={onClose} className="btn-ghost w-full text-sm">Cerrar</button>
    </div>
  )
}

export default function EntProducts() {
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [meta,        setMeta]        = useState(null)
  const [modal,       setModal]       = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [varModal,    setVarModal]    = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    productsAPI.list({ page, limit: 10 }).then(r => { setProducts(r.data.data); setMeta(r.data.meta) }).catch(() => {}).finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])
  useEffect(() => { categoriesAPI.list().then(r => setCategories(r.data.data)).catch(() => {}) }, [])

  const toggleActive = async (p) => {
    try { await productsAPI.update(p.id, { is_active: !p.is_active }); toast.success(p.is_active ? 'Producto desactivado' : 'Producto activado'); load() }
    catch { toast.error('Error al actualizar') }
  }

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return
    try { await productsAPI.remove(p.id); toast.success('Producto eliminado'); load() }
    catch { toast.error('Error al eliminar') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-heading font-black text-primary">Mis productos</h1>
          <p className="text-primary/50 font-body mt-1">{meta?.total || 0} productos registrados</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true) }} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" /> Nuevo producto
        </button>
      </div>

      {loading ? <div className="flex justify-center h-48 items-center"><Spinner /></div>
      : products.length === 0 ? <EmptyState icon={FiPackage} title="Sin productos" description="Agrega tu primer producto." action={<button onClick={() => setModal(true)} className="btn-primary">Agregar producto</button>} />
      : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>Producto</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {p.primary_image ? <img src={p.primary_image} alt="" className="w-full h-full object-cover" /> : <FiPackage className="w-5 h-5 text-primary/30" />}
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-sm">{p.name}</p>
                          {p.description && <p className="text-xs text-primary/40 line-clamp-1 max-w-xs">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="font-bold text-primary">${Number(p.base_price).toLocaleString('es-CO')}</span></td>
                    <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(p); setModal(true) }} className="p-2 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors" title="Editar"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => setVarModal(p.id)} className="p-2 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors text-xs font-semibold px-3">Variantes</button>
                        <button onClick={() => toggleActive(p)} className={`p-2 rounded-lg transition-colors ${p.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}>
                          {p.is_active ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} pages={meta?.pages || 1} onPageChange={setPage} />

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing ? 'Editar producto' : 'Nuevo producto'} size="lg">
        <ProductForm product={editing} categories={categories} onSuccess={() => { setModal(false); setEditing(null); load() }} onClose={() => { setModal(false); setEditing(null) }} />
      </Modal>

      <Modal open={!!varModal} onClose={() => setVarModal(null)} title="Gestionar variantes" size="md">
        {varModal && <VariantManager productId={varModal} onClose={() => { setVarModal(null); load() }} />}
      </Modal>
    </div>
  )
}
