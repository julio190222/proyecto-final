const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireEntrepreneur, requirePasswordChange } = require('../middlewares/auth');
const { uploadProduct } = require('../config/upload');
const { success, created, paginated } = require('../utils/response');
const { getPagination, generateSlug, getStockStatus } = require('../utils/helpers');

const auth = [authenticate, requireEntrepreneur, requirePasswordChange];

// GET productos de mi tienda
router.get('/', ...auth, async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE business_id=?', [biz[0].id]);
    const [rows] = await pool.query(
      `SELECT p.*, img.url AS primary_image FROM products p
       LEFT JOIN product_images img ON img.product_id=p.id AND img.is_primary=TRUE
       WHERE p.business_id=? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [biz[0].id, limit, offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
});

// POST crear producto
router.post('/', ...auth, async (req, res, next) => {
  try {
    const { name, description, base_price, subcategory_id, variants } = req.body;
    if (!name || !base_price) return res.status(422).json({ ok: false, message: 'Nombre y precio requeridos' });
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const slug = `${biz[0].id}-${generateSlug(name)}-${Date.now()}`;
    const [r] = await pool.query(
      'INSERT INTO products (business_id,subcategory_id,name,slug,description,base_price,is_active) VALUES (?,?,?,?,?,?,?)',
      [biz[0].id, subcategory_id||null, name, slug, description||null, base_price, true]
    );
    if (variants?.length) {
      const rows = variants.map(v => [r.insertId, v.attribute_name, v.attribute_value, v.price_modifier||0, v.stock||0, v.sku||null]);
      await pool.query('INSERT INTO product_variants (product_id,attribute_name,attribute_value,price_modifier,stock,sku) VALUES ?', [rows]);
    }
    return created(res, { id: r.insertId }, 'Producto creado');
  } catch (err) { next(err); }
});

// PUT editar producto
router.put('/:id', ...auth, async (req, res, next) => {
  try {
    const { name, description, base_price, subcategory_id, is_active } = req.body;
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    await pool.query(
      'UPDATE products SET name=COALESCE(?,name),description=COALESCE(?,description),base_price=COALESCE(?,base_price),subcategory_id=COALESCE(?,subcategory_id),is_active=COALESCE(?,is_active),updated_at=NOW() WHERE id=?',
      [name||null,description||null,base_price||null,subcategory_id||null,is_active??null,req.params.id]
    );
    return success(res, {}, 'Producto actualizado');
  } catch (err) { next(err); }
});

// DELETE eliminar producto
router.delete('/:id', ...auth, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
    return success(res, {}, 'Producto eliminado');
  } catch (err) { next(err); }
});

// POST subir imágenes de producto
router.post('/:id/images', ...auth, uploadProduct.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ ok: false, message: 'Archivos requeridos' });
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    const [[{ hasPrimary }]] = await pool.query('SELECT COUNT(*) AS hasPrimary FROM product_images WHERE product_id=? AND is_primary=TRUE', [req.params.id]);
    const rows = req.files.map((f, i) => [req.params.id, `/uploads/products/${f.filename}`, null, !hasPrimary && i===0, i]);
    await pool.query('INSERT INTO product_images (product_id,url,alt_text,is_primary,sort_order) VALUES ?', [rows]);
    return success(res, { count: rows.length }, 'Imágenes subidas');
  } catch (err) { next(err); }
});

module.exports = router;

// ============================================================
//  Variantes — CRUD completo
// ============================================================

// GET variantes de un producto
router.get('/:id/variants', ...auth, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });

    const [variants] = await pool.query(
      'SELECT * FROM product_variants WHERE product_id=? ORDER BY attribute_name, attribute_value',
      [req.params.id]
    );
    return success(res, variants);
  } catch (err) { next(err); }
});

// POST agregar variante
router.post('/:id/variants', ...auth, async (req, res, next) => {
  try {
    const { attribute_name, attribute_value, price_modifier, stock, sku } = req.body;
    if (!attribute_name || !attribute_value) {
      return res.status(422).json({ ok: false, message: 'attribute_name y attribute_value son requeridos' });
    }
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });

    const [r] = await pool.query(
      'INSERT INTO product_variants (product_id,attribute_name,attribute_value,price_modifier,stock,sku) VALUES (?,?,?,?,?,?)',
      [req.params.id, attribute_name, attribute_value, price_modifier||0, stock||0, sku||null]
    );
    return created(res, { id: r.insertId }, 'Variante creada');
  } catch (err) { next(err); }
});

// PUT editar variante (stock, precio, estado)
router.put('/:id/variants/:variantId', ...auth, async (req, res, next) => {
  try {
    const { attribute_name, attribute_value, price_modifier, stock, sku, is_active } = req.body;
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });

    const [variant] = await pool.query('SELECT id FROM product_variants WHERE id=? AND product_id=?', [req.params.variantId, req.params.id]);
    if (!variant.length) return res.status(404).json({ ok: false, message: 'Variante no encontrada' });

    await pool.query(
      `UPDATE product_variants SET
        attribute_name  = COALESCE(?, attribute_name),
        attribute_value = COALESCE(?, attribute_value),
        price_modifier  = COALESCE(?, price_modifier),
        stock           = COALESCE(?, stock),
        sku             = COALESCE(?, sku),
        is_active       = COALESCE(?, is_active)
       WHERE id = ?`,
      [attribute_name||null, attribute_value||null, price_modifier??null, stock??null, sku||null, is_active??null, req.params.variantId]
    );
    return success(res, {}, 'Variante actualizada');
  } catch (err) { next(err); }
});

// DELETE eliminar variante
router.delete('/:id/variants/:variantId', ...auth, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const [prod] = await pool.query('SELECT id FROM products WHERE id=? AND business_id=?', [req.params.id, biz[0]?.id]);
    if (!prod.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });

    await pool.query('DELETE FROM product_variants WHERE id=? AND product_id=?', [req.params.variantId, req.params.id]);
    return success(res, {}, 'Variante eliminada');
  } catch (err) { next(err); }
});

// GET comparador de productos (público)
router.get('/compare', async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(422).json({ ok: false, message: 'Parámetro ids requerido. Ej: ?ids=1,2,3' });

    const idList = ids.split(',').map(Number).filter(Boolean).slice(0, 3);
    if (idList.length < 2) return res.status(422).json({ ok: false, message: 'Mínimo 2 productos para comparar' });

    const [products] = await pool.query(
      `SELECT p.id, p.name, p.description, p.base_price,
              b.name AS business_name, b.slug AS business_slug,
              c.name AS subcategory,
              img.url AS image_url,
              ROUND(AVG(r.rating),1) AS avg_rating,
              COUNT(DISTINCT r.id) AS total_reviews
       FROM products p
       JOIN businesses b ON b.id = p.business_id
       LEFT JOIN categories c ON c.id = p.subcategory_id
       LEFT JOIN product_images img ON img.product_id = p.id AND img.is_primary = TRUE
       LEFT JOIN reviews r ON r.business_id = p.business_id AND r.is_visible = TRUE
       WHERE p.id IN (?) AND p.is_active = TRUE
       GROUP BY p.id`,
      [idList]
    );

    // Agregar variantes a cada producto
    if (products.length) {
      const [variants] = await pool.query(
        'SELECT * FROM product_variants WHERE product_id IN (?) AND is_active = TRUE',
        [products.map(p => p.id)]
      );
      const varMap = {};
      variants.forEach(v => {
        if (!varMap[v.product_id]) varMap[v.product_id] = [];
        varMap[v.product_id].push(v);
      });
      products.forEach(p => { p.variants = varMap[p.id] || []; });
    }

    return success(res, products);
  } catch (err) { next(err); }
});
