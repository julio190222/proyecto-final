// ============================================================
//  middlewares/auth.js
//  Verificación de JWT y control de roles
// ============================================================

const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

// ── Verifica que el token JWT sea válido ─────────────────────
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Token requerido' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario siga activo en la BD
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, must_change_password FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ ok: false, message: 'Usuario inactivo o no encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expirado' });
    }
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}

// ── Solo administradores ─────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Acceso restringido a administradores' });
  }
  next();
}

// ── Solo emprendedores ───────────────────────────────────────
function requireEntrepreneur(req, res, next) {
  if (req.user?.role !== 'entrepreneur') {
    return res.status(403).json({ ok: false, message: 'Acceso restringido a emprendedores' });
  }
  next();
}

// ── Verifica que el emprendedor deba cambiar su contraseña ───
function requirePasswordChange(req, res, next) {
  if (req.user?.must_change_password) {
    return res.status(403).json({
      ok: false,
      message: 'Debes cambiar tu contraseña antes de continuar',
      must_change_password: true,
    });
  }
  next();
}

// ── Admin o el mismo emprendedor dueño del recurso ───────────
async function requireOwnerOrAdmin(req, res, next) {
  if (req.user.role === 'admin') return next();

  try {
    const [rows] = await pool.query(
      'SELECT id FROM businesses WHERE id = ? AND user_id = ?',
      [req.params.businessId, req.user.id]
    );
    if (!rows.length) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso sobre este recurso' });
    }
    next();
  } catch {
    next(error);
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  requireEntrepreneur,
  requirePasswordChange,
  requireOwnerOrAdmin,
};
