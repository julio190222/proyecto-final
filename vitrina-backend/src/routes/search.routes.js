// ============================================================
//  routes/search.routes.js
//  GET /api/search?q=texto&type=businesses|products|all
// ============================================================
const router = require('express').Router();
const { pool } = require('../config/db');
const { success } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return success(res, { businesses: [], products: [] }, 'Ingresa al menos 2 caracteres');
    }

    const term = q.trim();

    // 🔥 Limpieza del término (evita errores en FULLTEXT)
    const cleanTerm = term.replace(/[^\w\s]/gi, '');

    const like = `%${cleanTerm}%`;
    const bool = cleanTerm.length >= 3 ? `${cleanTerm}*` : cleanTerm;

    const result = {};

    // ============================================================
    // BUSINESSES
    // ============================================================
    if (type === 'all' || type === 'businesses') {
      const [businesses] = await pool.query(
        `
        SELECT 
          b.id, b.name, b.slug, b.description,
          logo.url AS logo_url,
          ROUND(AVG(r.rating),1) AS avg_rating
        FROM businesses b
        LEFT JOIN business_media logo 
          ON logo.business_id = b.id 
         AND logo.media_type = 'logo'
        LEFT JOIN reviews r 
          ON r.business_id = b.id 
         AND r.is_visible = TRUE
        WHERE b.status = 'active'
          AND (
            (MATCH(b.name, b.description) AGAINST(? IN BOOLEAN MODE))
            OR b.name LIKE ?
          )
        GROUP BY b.id, b.name, b.slug, b.description, logo.url
        LIMIT 8
        `,
        [bool, like]
      );

      result.businesses = businesses;
    }

    // ============================================================
    // PRODUCTS
    // ============================================================
    if (type === 'all' || type === 'products') {
      const [products] = await pool.query(
        `
        SELECT 
          p.id, p.name, p.slug, p.base_price,
          img.url AS image_url,
          b.name AS business_name, 
          b.slug AS business_slug
        FROM products p
        JOIN businesses b 
          ON b.id = p.business_id 
         AND b.status = 'active'
        LEFT JOIN product_images img 
          ON img.product_id = p.id 
         AND img.is_primary = TRUE
        WHERE p.is_active = TRUE
          AND (
            (MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE))
            OR p.name LIKE ?
          )
        LIMIT 8
        `,
        [bool, like]
      );

      result.products = products;
    }

    return success(res, result);

  } catch (err) {
    console.error('ERROR SEARCH:', err); // 👈 DEBUG
    next(err);
  }
});

module.exports = router;