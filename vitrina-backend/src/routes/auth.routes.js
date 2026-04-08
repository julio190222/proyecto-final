// ============================================================
//  routes/auth.routes.js
// ============================================================
const router      = require('express').Router();
const controller  = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { loginRules, changePasswordRules, validate } = require('../validators/auth.validator');

// Login público
router.post('/login', loginRules, validate, controller.login);

// Cambio de contraseña
router.post('/change-password', authenticate, changePasswordRules, validate, controller.changePassword);

// Logout
router.post('/logout', authenticate, controller.logout);

// Restablecer contraseña (admin)
router.post('/reset-password/:userId', authenticate, requireAdmin, controller.resetPassword);

// GET perfil del usuario autenticado — el frontend lo necesita al recargar
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const { success } = require('../utils/response');

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active,
              u.must_change_password, u.last_login, u.created_at,
              b.id AS business_id, b.name AS business_name, b.slug AS business_slug
       FROM users u
       LEFT JOIN businesses b ON b.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!users.length) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });

    // Notificaciones sin leer
    const [[{ unread }]] = await pool.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    return success(res, { ...users[0], unread_notifications: unread });
  } catch (err) { next(err); }
});

module.exports = router;
