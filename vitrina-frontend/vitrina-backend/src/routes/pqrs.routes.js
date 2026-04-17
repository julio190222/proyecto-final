const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { success, created, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

// POST — enviar PQRS (público)
router.post('/', async (req, res, next) => {
  try {
    const { business_id, name, email, type, message } = req.body;
    const valid = ['petition','complaint','claim','suggestion'];
    if (!name || !email || !type || !message) return res.status(422).json({ ok: false, message: 'Faltan campos requeridos' });
    if (!valid.includes(type)) return res.status(422).json({ ok: false, message: 'Tipo de PQRS inválido' });
    const [result] = await pool.query(
      'INSERT INTO pqrs (business_id,name,email,type,message) VALUES (?,?,?,?,?)',
      [business_id||null, name, email, type, message]
    );
    // Notificar al admin
    await pool.query(
      `INSERT INTO notifications (user_id,title,message,type,reference_id,reference_type)
       SELECT id,'Nueva PQRS recibida',CONCAT('Nueva ',?,' de ',?),'pqrs',?,'pqrs' FROM users WHERE role='admin'`,
      [type, name, result.insertId]
    );
    return created(res, { id: result.insertId }, 'PQRS enviada correctamente');
  } catch (err) { next(err); }
});

// GET — listar (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, type } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (type)   { where += ' AND p.type = ?';   params.push(type); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM pqrs p ${where}`, params);
    const [rows] = await pool.query(
      `SELECT p.*, b.name AS business_name FROM pqrs p
       LEFT JOIN businesses b ON b.id = p.business_id
       ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
});

// GET — PQRS de mi tienda (emprendedor)
router.get('/my-store', authenticate, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const [rows] = await pool.query(
      'SELECT id,name,type,message,status,admin_response,created_at FROM pqrs WHERE business_id = ? ORDER BY created_at DESC',
      [biz[0].id]
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

// PATCH — responder PQRS (admin)
router.patch('/:id/respond', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { admin_response, status } = req.body;
    const [pqrs] = await pool.query('SELECT * FROM pqrs WHERE id = ?', [req.params.id]);
    if (!pqrs.length) return res.status(404).json({ ok: false, message: 'PQRS no encontrada' });
    await pool.query(
      'UPDATE pqrs SET admin_response=?,status=?,responded_at=NOW() WHERE id=?',
      [admin_response, status||'resolved', req.params.id]
    );
    // Notificar al emprendedor si la PQRS es de su tienda
    if (pqrs[0].business_id) {
      const [biz] = await pool.query('SELECT user_id FROM businesses WHERE id = ?', [pqrs[0].business_id]);
      if (biz.length) {
        await pool.query(
          `INSERT INTO notifications (user_id,title,message,type,reference_id,reference_type) VALUES (?,?,?,?,?,?)`,
          [biz[0].user_id, 'PQRS gestionada', 'El administrador respondió una PQRS relacionada con tu tienda.', 'pqrs', req.params.id, 'pqrs']
        );
        await pool.query('UPDATE pqrs SET notified_business=TRUE WHERE id=?', [req.params.id]);
      }
    }
    return success(res, {}, 'PQRS respondida correctamente');
  } catch (err) { next(err); }
});

module.exports = router;
