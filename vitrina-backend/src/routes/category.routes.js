const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { success, created } = require('../utils/response');
const { generateSlug } = require('../utils/helpers');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(DISTINCT bc.business_id) AS business_count
       FROM categories c LEFT JOIN business_categories bc ON bc.category_id = c.id
       GROUP BY c.id ORDER BY c.parent_id IS NOT NULL, c.parent_id, c.name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, parent_id, description } = req.body;
    if (!name) return res.status(422).json({ ok: false, message: 'El nombre es requerido' });
    const slug = generateSlug(name);
    const [r] = await pool.query(
      'INSERT INTO categories (parent_id,name,slug,description) VALUES (?,?,?,?)',
      [parent_id||null, name, slug, description||null]
    );
    return created(res, { id: r.insertId, name, slug }, 'Categoría creada');
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;
    await pool.query(
      'UPDATE categories SET name=COALESCE(?,name), description=COALESCE(?,description), is_active=COALESCE(?,is_active) WHERE id=?',
      [name||null, description||null, is_active??null, req.params.id]
    );
    return success(res, {}, 'Categoría actualizada');
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM business_categories WHERE category_id = ?', [req.params.id]
    );
    if (total > 0) return res.status(409).json({ ok: false, message: `No se puede eliminar: ${total} negocio(s) la usan` });
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Categoría eliminada');
  } catch (err) { next(err); }
});

module.exports = router;
