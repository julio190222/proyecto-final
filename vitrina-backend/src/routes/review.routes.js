const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { success, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

// POST — crear reseña (público)
router.post('/', async (req, res, next) => {
  try {
    const { business_id, product_id, reviewer_name, reviewer_email, rating, comment } = req.body;
    if (!business_id || !reviewer_name || !rating) return res.status(422).json({ ok: false, message: 'Faltan campos requeridos' });
    if (rating < 1 || rating > 5) return res.status(422).json({ ok: false, message: 'Rating debe ser entre 1 y 5' });
    await pool.query(
      'INSERT INTO reviews (business_id,product_id,reviewer_name,reviewer_email,rating,comment) VALUES (?,?,?,?,?,?)',
      [business_id, product_id||null, reviewer_name, reviewer_email||null, rating, comment||null]
    );
    return res.status(201).json({ ok: true, message: 'Reseña registrada' });
  } catch (err) { next(err); }
});

// GET — listar reseñas (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM reviews');
    const [rows] = await pool.query(
      `SELECT r.*, b.name AS business_name, p.name AS product_name
       FROM reviews r JOIN businesses b ON b.id = r.business_id
       LEFT JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
});

// PATCH — visibilidad (admin)
router.patch('/:id/visibility', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { is_visible } = req.body;
    await pool.query('UPDATE reviews SET is_visible = ? WHERE id = ?', [Boolean(is_visible), req.params.id]);
    return success(res, {}, is_visible ? 'Reseña visible' : 'Reseña oculta');
  } catch (err) { next(err); }
});

module.exports = router;
