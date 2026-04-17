const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middlewares/auth');
const { success } = require('../utils/response');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', [req.user.id]
    );
    const [[{ unread }]] = await pool.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE', [req.user.id]
    );
    return success(res, { notifications: rows, unread });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return success(res, {}, 'Notificación marcada como leída');
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    return success(res, {}, 'Todas las notificaciones marcadas como leídas');
  } catch (err) { next(err); }
});

module.exports = router;
