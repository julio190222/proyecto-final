// ============================================================
//  services/auth.service.js
//  Lógica de negocio — Autenticación
// ============================================================

const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { pool }   = require('../config/db');
const logger     = require('../config/logger');

// ── Login ────────────────────────────────────────────────────
async function login(email, password, ip, userAgent) {
  // 1. Buscar usuario por email
  const [users] = await pool.query(
    `SELECT id, name, email, password_hash, role, is_active, must_change_password
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  const user = users[0];

  // 2. Registrar intento fallido si no existe
  if (!user) {
    await _logSession(null, ip, userAgent, 'failed_login');
    throw { statusCode: 401, message: 'Credenciales incorrectas' };
  }

  // 3. Verificar contraseña
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await _logSession(user.id, ip, userAgent, 'failed_login');
    throw { statusCode: 401, message: 'Credenciales incorrectas' };
  }

  // 4. Verificar cuenta activa
  if (!user.is_active) {
    throw { statusCode: 403, message: 'Tu cuenta está desactivada. Contacta al administrador.' };
  }

  // 5. Generar JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  // 6. Actualizar last_login y registrar sesión
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
  await _logSession(user.id, ip, userAgent, 'login');

  // 7. Si es emprendedor buscar su business_id
  let businessId = null;
  if (user.role === 'entrepreneur') {
    const [biz] = await pool.query(
      'SELECT id FROM businesses WHERE user_id = ?', [user.id]
    );
    businessId = biz[0]?.id || null;
  }

  logger.info(`Login exitoso — usuario ${user.id} (${user.role})`);

  return {
    token,
    user: {
      id                  : user.id,
      name                : user.name,
      email               : user.email,
      role                : user.role,
      must_change_password: user.must_change_password,
      business_id         : businessId,
    },
  };
}

// ── Cambio de contraseña ─────────────────────────────────────
async function changePassword(userId, currentPassword, newPassword, ip, userAgent) {
  const [users] = await pool.query(
    'SELECT id, password_hash, must_change_password FROM users WHERE id = ?',
    [userId]
  );

  const user = users[0];
  if (!user) throw { statusCode: 404, message: 'Usuario no encontrado' };

  // Si no es primer login, verificar contraseña actual
  if (!user.must_change_password) {
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw { statusCode: 401, message: 'Contraseña actual incorrecta' };
  }

  // Hashear nueva contraseña
  const hash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
    [hash, userId]
  );

  await _logSession(userId, ip, userAgent, 'password_change');
  logger.info(`Contraseña actualizada — usuario ${userId}`);
}

// ── Logout ───────────────────────────────────────────────────
async function logout(userId, ip, userAgent) {
  await _logSession(userId, ip, userAgent, 'logout');
  logger.info(`Logout — usuario ${userId}`);
}

// ── Restablecer contraseña (admin) ───────────────────────────
async function resetPassword(targetUserId, adminId) {
  const [users] = await pool.query(
    'SELECT id, name FROM users WHERE id = ? AND role = ?',
    [targetUserId, 'entrepreneur']
  );

  if (!users.length) throw { statusCode: 404, message: 'Emprendedor no encontrado' };

  // Generar contraseña temporal legible
  const tempPassword = _generateTempPassword();
  const hash         = await bcrypt.hash(tempPassword, 12);

  await pool.query(
    'UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?',
    [hash, targetUserId]
  );

  logger.info(`Contraseña restablecida por admin ${adminId} para usuario ${targetUserId}`);

  return { temp_password: tempPassword, user_name: users[0].name };
}

// ── Helpers privados ─────────────────────────────────────────
async function _logSession(userId, ip, userAgent, action) {
  try {
    await pool.query(
      'INSERT INTO session_logs (user_id, ip_address, user_agent, action) VALUES (?,?,?,?)',
      [userId, ip || '0.0.0.0', userAgent || '', action]
    );
  } catch (e) {
    logger.error('Error al registrar session_log:', e.message);
  }
}

function _generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = { login, changePassword, logout, resetPassword };
