// ============================================================
//  services/public.service.js
//  Portal público — Módulo 1
//  Sin autenticación — acceso libre
// ============================================================

const { pool }          = require('../config/db');
const { getStockStatus } = require('../utils/helpers');

// ── Listar emprendimientos (vitrina) ─────────────────────────
async function listBusinesses({ page, limit, offset, search, category_slug, subcategory_slug, sort }) {
  const params  = [];
  const joins   = [`LEFT JOIN business_categories bc ON bc.business_id = b.id`];
  const wheres  = [`b.status = 'active'`];

  // Filtro por categoría o subcategoría
  if (subcategory_slug) {
    joins.push(`JOIN categories sub ON sub.id = bc.category_id AND sub.slug = ?`);
    params.push(subcategory_slug);
  } else if (category_slug) {
    joins.push(`JOIN categories cat ON (cat.id = bc.category_id AND cat.slug = ?) OR (cat.parent_id = (SELECT id FROM categories WHERE slug = ?) AND cat.id = bc.category_id)`);
    params.push(category_slug, category_slug);
  }

  // Búsqueda full-text
  if (search) {
    wheres.push(`(MATCH(b.name, b.description) AGAINST(? IN BOOLEAN MODE) OR b.name LIKE ?)`);
    params.push(`${search}*`, `%${search}%`);
  }

  const whereSQL = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
  const joinSQL  = joins.join(' ');

  // Total
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT b.id) AS total FROM businesses b ${joinSQL} ${whereSQL}`,
    params
  );

  // Ordenamiento
  let orderSQL = 'ORDER BY b.created_at DESC';
  if (sort === 'rating')  orderSQL = 'ORDER BY avg_rating DESC, b.created_at DESC';
  if (sort === 'newest')  orderSQL = 'ORDER BY b.created_at DESC';

  const [rows] = await pool.query(
  `SELECT DISTINCT
     b.id, b.name, b.slug, b.description, b.address,
     b.whatsapp, b.instagram, b.facebook, b.tiktok, b.website,
     b.created_at,
     ROUND(AVG(r.rating), 1)   AS avg_rating,
     COUNT(DISTINCT r.id)       AS total_reviews,
     MAX(logo.url)              AS logo_url,
     MAX(cover.url)             AS cover_url
    FROM businesses b
    ${joinSQL}
    LEFT JOIN reviews r     ON r.business_id = b.id AND r.is_visible = TRUE
    LEFT JOIN business_media logo  ON logo.business_id  = b.id AND logo.media_type  = 'logo'
    LEFT JOIN business_media cover ON cover.business_id = b.id AND cover.media_type = 'cover'
    ${whereSQL}
    GROUP BY b.id
    ${orderSQL}
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Agregar categorías a cada negocio
  if (rows.length) {
    const ids = rows.map(r => r.id);
    const [cats] = await pool.query(
      `SELECT bc.business_id, c.id, c.name, c.slug, c.parent_id
       FROM business_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.business_id IN (?)`,
      [ids]
    );
    const catMap = {};
    cats.forEach(c => {
      if (!catMap[c.business_id]) catMap[c.business_id] = [];
      catMap[c.business_id].push({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id });
    });
    rows.forEach(r => { r.categories = catMap[r.id] || []; });
  }

  return { rows, total };
}

// ── Perfil público de un negocio ─────────────────────────────
async function getBusinessBySlug(slug) {
  const [businesses] = await pool.query(
    `SELECT b.id, b.name, b.slug, b.description, b.address,
            b.whatsapp, b.instagram, b.facebook, b.tiktok, b.website,
            b.catalog_pdf_url, b.created_at,
            ROUND(AVG(r.rating),1) AS avg_rating,
            COUNT(DISTINCT r.id)  AS total_reviews
     FROM businesses b
     LEFT JOIN reviews r ON r.business_id = b.id AND r.is_visible = TRUE
     WHERE b.slug = ? AND b.status = 'active'
     GROUP BY b.id`,
    [slug]
  );

  if (!businesses.length) throw { statusCode: 404, message: 'Emprendimiento no encontrado' };
  const biz = businesses[0];

  // Media
  const [media] = await pool.query(
    'SELECT media_type, url, alt_text, sort_order FROM business_media WHERE business_id = ? ORDER BY media_type, sort_order',
    [biz.id]
  );

  // Horarios
  const [hours] = await pool.query(
    'SELECT day_of_week, open_time, close_time, is_closed FROM business_hours WHERE business_id = ? ORDER BY day_of_week',
    [biz.id]
  );

  // Categorías
  const [categories] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.parent_id
     FROM business_categories bc JOIN categories c ON c.id = bc.category_id
     WHERE bc.business_id = ?`,
    [biz.id]
  );

  // Productos activos con variantes e imágenes
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.base_price, p.created_at,
            c.name AS subcategory_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.subcategory_id
     WHERE p.business_id = ? AND p.is_active = 1
     ORDER BY p.created_at DESC`,
    [biz.id]
  );

  if (products.length) {
    const pids = products.map(p => p.id);

    const [variants] = await pool.query(
      `SELECT product_id, attribute_name, attribute_value, price_modifier, stock, sku
       FROM product_variants WHERE product_id IN (?) AND is_active = TRUE`,
      [pids]
    );

    const [images] = await pool.query(
      `SELECT product_id, url, alt_text, is_primary, sort_order
       FROM product_images WHERE product_id IN (?) ORDER BY sort_order`,
      [pids]
    );

    // Agrupar por producto y calcular stock_status
    const varMap = {};
    variants.forEach(v => {
      if (!varMap[v.product_id]) varMap[v.product_id] = [];
      varMap[v.product_id].push(v);
    });
    const imgMap = {};
    images.forEach(i => {
      if (!imgMap[i.product_id]) imgMap[i.product_id] = [];
      imgMap[i.product_id].push(i);
    });

    products.forEach(p => {
      p.variants   = varMap[p.id] || [];
      p.images     = imgMap[p.id] || [];
      const stock  = p.variants.reduce((s, v) => s + v.stock, 0);
      p.stock_status = getStockStatus(stock);
      p.total_stock  = stock;
      // Días como "nuevo" si fue creado en los últimos 30 días
      const days   = (Date.now() - new Date(p.created_at)) / 86400000;
      p.is_new     = days <= 30;
    });
  }

  // Reseñas visibles
  const [reviews] = await pool.query(
    `SELECT id, product_id, reviewer_name, rating, comment, created_at
     FROM reviews WHERE business_id = ? AND is_visible = TRUE
     ORDER BY created_at DESC LIMIT 10`,
    [biz.id]
  );

  return {
    ...biz,
    media      : media,
    logo_url   : media.find(m => m.media_type === 'logo')?.url  || null,
    cover_url  : media.find(m => m.media_type === 'cover')?.url || null,
    gallery    : media.filter(m => m.media_type === 'gallery'),
    hours,
    categories,
    products,
    reviews,
  };
}

// ── Categorías con subcategorías ─────────────────────────────
async function getCategories() {
  const [all] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.parent_id,
            COUNT(DISTINCT bc.business_id) AS business_count
     FROM categories c
     LEFT JOIN business_categories bc ON bc.category_id = c.id
     WHERE c.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.parent_id IS NOT NULL, c.parent_id, c.name`
  );

  // Construir árbol principal → subcategorías
  const parents = all.filter(c => !c.parent_id);
  parents.forEach(p => {
    p.subcategories = all.filter(c => c.parent_id === p.id);
  });

  return parents;
}

// ── Productos similares / recomendaciones ────────────────────
async function getSimilarProducts(productId, limit = 4) {
  const [current] = await pool.query(
    'SELECT subcategory_id, business_id FROM products WHERE id = ?', [productId]
  );
  if (!current.length) return [];

  const { subcategory_id, business_id } = current[0];

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.base_price,
            img.url AS image_url,
            b.name AS business_name, b.slug AS business_slug
     FROM products p
     JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
     LEFT JOIN product_images img ON img.product_id = p.id AND img.is_primary = TRUE
     WHERE p.subcategory_id = ? AND p.id != ? AND p.is_active = TRUE
     ORDER BY RAND()
     LIMIT ?`,
    [subcategory_id, productId, limit]
  );

  return rows;
}

module.exports = { listBusinesses, getBusinessBySlug, getCategories, getSimilarProducts };
