const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireAdmin, requireEntrepreneur, requirePasswordChange } = require('../middlewares/auth');
const { success } = require('../utils/response');

// POST /api/analytics/event — registrar evento (público)
router.post('/event', async (req, res, next) => {
  try {
    const { business_id, product_id, event_type, session_id, duration_seconds, search_query } = req.body;
    const allowed = ['page_view','product_view','whatsapp_click','search','catalog_download','category_view'];
    if (!allowed.includes(event_type)) return res.status(400).json({ ok: false, message: 'event_type inválido' });
    await pool.query(
      'INSERT INTO analytics_events (business_id,product_id,event_type,session_id,duration_seconds,search_query) VALUES (?,?,?,?,?,?)',
      [business_id||null, product_id||null, event_type, session_id||'anonymous', duration_seconds||0, search_query||null]
    );
    return success(res, {}, 'Evento registrado');
  } catch (err) { next(err); }
});

// GET /api/analytics/global — métricas globales (admin)
router.get('/global', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = from && to ? 'AND created_at BETWEEN ? AND ?' : '';
    const dateParams = from && to ? [from, to] : [];

    const [[metrics]] = await pool.query(`SELECT * FROM view_platform_metrics`);
    const [topProducts] = await pool.query(
      `SELECT p.name, p.slug, b.name AS business, COUNT(*) AS views
       FROM analytics_events ae JOIN products p ON p.id = ae.product_id
       JOIN businesses b ON b.id = p.business_id
       WHERE ae.event_type = 'product_view' ${dateFilter}
       GROUP BY ae.product_id ORDER BY views DESC LIMIT 5`, dateParams
    );
    const [topBusinesses] = await pool.query(
      `SELECT b.name, b.slug, COUNT(*) AS visits
       FROM analytics_events ae JOIN businesses b ON b.id = ae.business_id
       WHERE ae.event_type = 'page_view' ${dateFilter}
       GROUP BY ae.business_id ORDER BY visits DESC LIMIT 5`, dateParams
    );
    const [byCategory] = await pool.query(
      `SELECT c.name, COUNT(DISTINCT bc.business_id) AS total
       FROM categories c JOIN business_categories bc ON bc.category_id = c.id
       WHERE c.parent_id IS NULL GROUP BY c.id ORDER BY total DESC`
    );
    return success(res, { metrics, top_products: topProducts, top_businesses: topBusinesses, by_category: byCategory });
  } catch (err) { next(err); }
});

// GET /api/analytics/my-store — métricas del emprendedor
router.get('/my-store', authenticate, requireEntrepreneur, requirePasswordChange, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const bizId = biz[0].id;

    const [[visits]]   = await pool.query(`SELECT COUNT(*) AS total FROM analytics_events WHERE business_id = ? AND event_type = 'page_view'`, [bizId]);
    const [[whatsapp]] = await pool.query(`SELECT COUNT(*) AS total FROM analytics_events WHERE business_id = ? AND event_type = 'whatsapp_click'`, [bizId]);
    const [[avgRating]]= await pool.query(`SELECT ROUND(AVG(rating),1) AS avg, COUNT(*) AS total FROM reviews WHERE business_id = ? AND is_visible = TRUE`, [bizId]);
    const [topProducts]= await pool.query(
      `SELECT p.name, p.slug, COUNT(*) AS views FROM analytics_events ae
       JOIN products p ON p.id = ae.product_id
       WHERE ae.business_id = ? AND ae.event_type = 'product_view'
       GROUP BY ae.product_id ORDER BY views DESC LIMIT 5`, [bizId]
    );
    return success(res, { visits: visits.total, whatsapp_clicks: whatsapp.total, avg_rating: avgRating.avg, total_reviews: avgRating.total, top_products: topProducts });
  } catch (err) { next(err); }
});

module.exports = router;
