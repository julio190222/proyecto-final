// ============================================================
//  services/user.service.js
//  Lógica de negocio — Gestión de usuarios (Módulo 2)
// ============================================================

const bcrypt          = require('bcryptjs');
const { pool }        = require('../config/db');
const { generateSlug} = require('../utils/helpers');
const logger          = require('../config/logger');

// ── Listar todos los emprendedores ───────────────────────────
async function listEntrepreneurs({ page, limit, offset, search }) {
  let where = "WHERE u.role = 'entrepreneur'";
  const params = [];

  if (search) {
    where += ' AND (u.name LIKE ? OR u.email LIKE ? OR b.name LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS total
     FROM users u
     LEFT JOIN businesses b ON b.user_id = u.id
     ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.is_active, u.must_change_password,
       u.last_login, u.created_at,
       b.id AS business_id, b.name AS business_name, b.status AS business_status
     FROM users u
     LEFT JOIN businesses b ON b.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total };
}

// ── Obtener un usuario con su negocio y sesiones ─────────────
async function getUserById(id) {
  const [users] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active,
            u.must_change_password, u.last_login, u.created_at,
            b.id AS business_id, b.name AS business_name, b.slug AS business_slug
     FROM users u
     LEFT JOIN businesses b ON b.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );

  if (!users.length) throw { statusCode: 404, message: 'Usuario no encontrado' };

  const [sessions] = await pool.query(
    `SELECT ip_address, user_agent, action, created_at
     FROM session_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [id]
  );

  return { ...users[0], session_logs: sessions };
}

// ── Crear emprendedor + microtienda ──────────────────────────
async function createEntrepreneur(data, adminId) {
  const {
    name, email, business_name, description,
    address, whatsapp, instagram, facebook,
    tiktok, website, category_ids,
  } = data;

  // Verificar email único
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw { statusCode: 409, message: 'Ya existe un usuario con ese email' };

  // Contraseña temporal
  const tempPassword = _generateTempPassword();
  const hash         = await bcrypt.hash(tempPassword, 12);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear usuario
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role, is_active, must_change_password)
       VALUES (?, ?, ?, 'entrepreneur', TRUE, TRUE)`,
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const userId = userResult.insertId;

    // 2. Crear microtienda
    const bizSlug = await _uniqueSlug(conn, generateSlug(business_name));
    const [bizResult] = await conn.query(
      `INSERT INTO businesses
         (user_id, name, slug, description, address, whatsapp, instagram, facebook, tiktok, website, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [userId, business_name.trim(), bizSlug, description || null,
       address || null, whatsapp || null, instagram || null,
       facebook || null, tiktok || null, website || null]
    );
    const businessId = bizResult.insertId;

    // 3. Asignar categorías
    if (category_ids?.length) {
      const values = category_ids.map(cid => [businessId, cid]);
      await conn.query('INSERT INTO business_categories (business_id, category_id) VALUES ?', [values]);
    }

    // 4. Horarios vacíos (7 días, todos cerrados por defecto)
    const hoursValues = [0,1,2,3,4,5,6].map(d => [businessId, d, null, null, true]);
    await conn.query(
      'INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_closed) VALUES ?',
      [hoursValues]
    );

    await conn.commit();
    logger.info(`Emprendedor creado — userId:${userId} businessId:${businessId} por admin:${adminId}`);

    return {
      user_id     : userId,
      business_id : businessId,
      temp_password: tempPassword,
      email,
      business_name: business_name.trim(),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Editar usuario ───────────────────────────────────────────
async function updateUser(id, data) {
  const { name, email, is_active } = data;

  const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
  if (!existing.length) throw { statusCode: 404, message: 'Usuario no encontrado' };

  if (email) {
    const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (dup.length) throw { statusCode: 409, message: 'Ese email ya está en uso' };
  }

  await pool.query(
    `UPDATE users SET
       name      = COALESCE(?, name),
       email     = COALESCE(?, email),
       is_active = COALESCE(?, is_active),
       updated_at = NOW()
     WHERE id = ?`,
    [name || null, email || null, is_active ?? null, id]
  );

  logger.info(`Usuario ${id} actualizado`);
}

// ── Activar / desactivar cuenta ──────────────────────────────
async function toggleStatus(id, is_active) {
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE id = ? AND role = 'entrepreneur'", [id]
  );
  if (!existing.length) throw { statusCode: 404, message: 'Emprendedor no encontrado' };

  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

  // Reflejar en el negocio
  const status = is_active ? 'active' : 'inactive';
  await pool.query('UPDATE businesses SET status = ? WHERE user_id = ?', [status, id]);

  logger.info(`Usuario ${id} ${is_active ? 'activado' : 'desactivado'}`);
}

// ── Helpers ──────────────────────────────────────────────────
async function _uniqueSlug(conn, base) {
  let slug = base;
  let i    = 1;
  while (true) {
    const [rows] = await conn.query('SELECT id FROM businesses WHERE slug = ?', [slug]);
    if (!rows.length) return slug;
    slug = `${base}-${i++}`;
  }
}

function _generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = { listEntrepreneurs, getUserById, createEntrepreneur, updateUser, toggleStatus };
